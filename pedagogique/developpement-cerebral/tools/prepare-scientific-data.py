"""Package published regional CT predictions and matching fsaverage5 atlas.

Requires NumPy. Source: Lotter et al. (2024), Rutherford et al. (2022).
Only the 5–20-year interval used by Lotter et al. is retained; predictions
outside that supported interval are deliberately excluded from this asset.
Derived data retain CC BY-NC-SA 4.0, separately from application code.
"""

import argparse
import base64
import hashlib
import io
import json
from pathlib import Path
from urllib.request import urlopen
import xml.etree.ElementTree as ET
import zlib

import numpy as np

COMMIT = "418ff157bd8036e01a5d823754bbd7cff5fdda1b"
ROOT = f"https://raw.githubusercontent.com/LeonDLotter/CTdev/{COMMIT}/"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache-dir", type=Path)
    args = parser.parse_args()
    checksums = {}

    def read(name):
        cached = args.cache_dir / Path(name).name if args.cache_dir else None
        if cached and cached.exists():
            content = cached.read_bytes()
        else:
            with urlopen(ROOT + name, timeout=30) as response:
                content = response.read()
        checksums[name] = hashlib.sha256(content).hexdigest()
        return content

    ages = np.loadtxt(io.BytesIO(read("data_rutherford/ct_predicted_tps.txt")))
    centiles = np.loadtxt(io.BytesIO(read("data_rutherford/ct_predicted_centiles.txt")))
    median_indices = np.flatnonzero(centiles == 0.5)
    assert len(median_indices) == 1
    median_index = int(median_indices[0])
    parcels = read("data_rutherford/ct_predicted_parcels.txt").decode().splitlines()
    women = np.load(io.BytesIO(read("data_rutherford/ct_predicted_f.npy")), allow_pickle=False)
    men = np.load(io.BytesIO(read("data_rutherford/ct_predicted_m.npy")), allow_pickle=False)
    assert women.shape == men.shape == (148, len(ages), len(centiles))
    selected = np.flatnonzero((ages >= 5) & (ages <= 20))
    assert len(selected) == 31
    assert np.all(np.diff(ages[selected]) == 0.5)
    labels = []
    atlas_names = {}
    for hemisphere in ("L", "R"):
        root = ET.fromstring(read(f"templates/destrieux.fsa.10k.{hemisphere}.label.gii"))
        data = root.find("DataArray")
        assert data.attrib["Dim0"] == "10242"
        raw = zlib.decompress(base64.b64decode(data.findtext("Data")))
        vertex_labels = np.frombuffer(raw, dtype="<i4")
        labels.append(vertex_labels.astype("<u2"))
        for label in root.findall("./LabelTable/Label"):
            atlas_names[int(label.attrib["Key"])] = label.text
    vertex_labels = np.concatenate(labels)
    assert vertex_labels.shape == (20484,)
    assert np.array_equal(np.unique(vertex_labels), np.arange(149))
    for i, parcel in enumerate(parcels):
        expected = parcel[3:].removesuffix("_thickness").replace("&", "_and_")
        assert expected == atlas_names[i + 1], (parcel, atlas_names[i + 1])
    female = women[:, selected, median_index]
    male = men[:, selected, median_index]
    assert np.all(np.isfinite(female)) and np.all(np.isfinite(male))
    target = Path(__file__).resolve().parents[1] / "assets"
    target.mkdir(exist_ok=True)
    vertex_labels.tofile(target / "destrieux-labels.bin")
    dataset = {
        "metric": "cortical_thickness",
        "unit": "mm",
        "minimumAge": 5,
        "maximumAge": 20,
        "ages": ages[selected].tolist(),
        "colorDomain": [1.5, 4.0],
        "aggregation": "arithmetic mean of female and male model medians; not a pooled population median",
        "atlas": "Destrieux 2010, fsaverage5, 74 regions per hemisphere",
        "source": {
            "repository": "https://github.com/LeonDLotter/CTdev",
            "commit": COMMIT,
            "publication": "https://doi.org/10.1038/s41467-024-52366-7",
            "originalModel": "https://doi.org/10.7554/eLife.72904",
            "dataset": "https://doi.org/10.5281/zenodo.7902901",
            "license": "CC-BY-NC-SA-4.0",
            "inputSha256": checksums,
        },
        "regions": [{
            "id": i + 1,
            "name": parcel,
            "femaleMedian": np.round(female[i], 6).tolist(),
            "maleMedian": np.round(male[i], 6).tolist(),
        } for i, parcel in enumerate(parcels)],
    }
    license_text = read("license.txt")
    (target / "ctdev-license.txt").write_bytes(license_text.rstrip() + b"\n")
    (target / "cortical-thickness.json").write_text(json.dumps(dataset, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"148 regions, {len(selected)} ages, {len(vertex_labels)} atlas vertices")


if __name__ == "__main__":
    main()
