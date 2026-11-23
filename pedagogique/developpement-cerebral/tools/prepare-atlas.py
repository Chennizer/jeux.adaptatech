"""Package the anatomical Destrieux fsaverage5 atlas from pinned CTdev labels.

Requires NumPy. No thickness estimates or developmental measurements are used.
Derived data retain CC BY-NC-SA 4.0, separately from application code.
"""

import argparse
import base64
import hashlib
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
    target = Path(__file__).resolve().parents[1] / "assets"
    target.mkdir(exist_ok=True)
    vertex_labels.tofile(target / "destrieux-labels.bin")
    metadata = {
        "atlas": "Destrieux 2010, fsaverage5, 74 regions per hemisphere",
        "repository": "https://github.com/LeonDLotter/CTdev", "commit": COMMIT,
        "dataset": "https://doi.org/10.5281/zenodo.7902901",
        "atlasPublication": "https://doi.org/10.1016/j.neuroimage.2010.06.010",
        "license": "CC-BY-NC-SA-4.0", "inputSha256": checksums,
        "vertices": len(vertex_labels),
        "regions": [{"id": i, "name": atlas_names[i]} for i in range(1, 149)],
        "interpretation": "anatomical regions only; no developmental values or thickness estimates",
    }
    license_text = read("license.txt")
    (target / "ctdev-license.txt").write_bytes(license_text.rstrip() + b"\n")
    (target / "atlas-source.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")
    print(f"148 anatomical regions, {len(vertex_labels)} atlas vertices")


if __name__ == "__main__":
    main()
