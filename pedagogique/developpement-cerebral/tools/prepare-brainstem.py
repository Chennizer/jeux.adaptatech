"""Extract the fsaverage brainstem (aseg label 16) in cortical surface RAS.

Requires NumPy, SciPy, NiBabel and scikit-image. The result is an anatomical
adult template, not a developmental measurement or a generated stalk.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

import nibabel as nib
import numpy as np
from scipy.ndimage import gaussian_filter
from skimage.measure import marching_cubes

COMMIT = "20cc221d737a37a6ee3a9c007e91bd69541fefe9"
SOURCE = f"https://raw.githubusercontent.com/mne-tools/mne-testing-data/{COMMIT}/subjects/fsaverage/mri/aseg.mgz"
SOURCE_SHA256 = "b55ef817e5e5bd1a3d76d4a2305283eef16fbff199ead3d840dd4b0fa8205e48"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--segmentation", type=Path, required=True)
    args = parser.parse_args()
    source_digest = hashlib.sha256(args.segmentation.read_bytes()).hexdigest()
    if source_digest != SOURCE_SHA256:
        raise ValueError(f"Expected the pinned segmentation from {SOURCE}")
    img = nib.load(args.segmentation)
    mask = np.asarray(img.dataobj) == 16
    coordinates = np.argwhere(mask)
    lower, upper = coordinates.min(0) - 3, coordinates.max(0) + 4
    cropped = mask[tuple(slice(a, b) for a, b in zip(lower, upper))].astype("f4")
    vertices, faces, _, _ = marching_cubes(gaussian_filter(cropped, 0.8), 0.5)
    vertices = nib.affines.apply_affine(img.header.get_vox2ras_tkr(), vertices + lower)
    signed_volume = np.einsum("ij,ij->i", vertices[faces[:, 0]], np.cross(vertices[faces[:, 1]], vertices[faces[:, 2]])).sum() / 6
    if signed_volume < 0:
        faces = faces[:, [0, 2, 1]]
    assert len(vertices) < 65536
    target = Path(__file__).resolve().parents[1] / "assets"
    payload = struct.pack("<4I", 0x42535431, len(vertices), faces.size, 0)
    payload += vertices.astype("<f4").tobytes() + faces.astype("<u2").tobytes()
    (target / "brainstem.bin").write_bytes(payload)
    metadata = {
        "source": SOURCE, "commit": COMMIT, "label": 16,
        "sourceSha256": source_digest,
        "coordinateSystem": "FreeSurfer tkregister RAS, millimetres",
        "processing": "aseg label 16; Gaussian sigma 0.8 voxel; marching cubes at 0.5; outward face winding",
        "vertices": len(vertices), "triangles": len(faces),
        "boundsRAS": [vertices.min(0).tolist(), vertices.max(0).tolist()],
        "development": "colour is qualitative and illustrative; no fitted brainstem maturity curve",
    }
    (target / "brainstem-source.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(f"Brainstem: {len(vertices)} vertices, {len(faces)} triangles, {len(payload)} bytes")


if __name__ == "__main__":
    main()
