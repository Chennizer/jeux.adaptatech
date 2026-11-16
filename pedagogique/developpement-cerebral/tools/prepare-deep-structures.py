"""Extract cerebellar and subcortical fsaverage surfaces in cortical RAS.

Requires NumPy, SciPy, NiBabel and scikit-image. The result is an anatomical
adult template, not developmental measurements or invented anatomy.
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
    segmentation = np.asarray(img.dataobj)
    definitions = [
        ("cerebellum-left", "Cervelet · gauche", "cerebellum", [7, 8]),
        ("cerebellum-right", "Cervelet · droite", "cerebellum", [46, 47]),
        ("thalamus-left", "Thalamus · gauche", "thalamus", [10]),
        ("thalamus-right", "Thalamus · droite", "thalamus", [49]),
        ("caudate-left", "Noyau caudé · gauche", "caudate", [11]),
        ("caudate-right", "Noyau caudé · droite", "caudate", [50]),
        ("putamen-left", "Putamen · gauche", "putamen", [12]),
        ("putamen-right", "Putamen · droite", "putamen", [51]),
        ("pallidum-left", "Pallidum · gauche", "pallidum", [13]),
        ("pallidum-right", "Pallidum · droite", "pallidum", [52]),
        ("hippocampus-left", "Hippocampe · gauche", "hippocampus", [17]),
        ("hippocampus-right", "Hippocampe · droite", "hippocampus", [53]),
        ("amygdala-left", "Amygdale · gauche", "amygdala", [18]),
        ("amygdala-right", "Amygdale · droite", "amygdala", [54]),
        ("accumbens-left", "Noyau accumbens · gauche", "accumbens", [26]),
        ("accumbens-right", "Noyau accumbens · droite", "accumbens", [58]),
    ]
    positions, indices, parts = [], [], []
    vertex_offset = index_offset = 0
    for identifier, name, kind, labels in definitions:
        mask = np.isin(segmentation, labels)
        coordinates = np.argwhere(mask)
        lower, upper = coordinates.min(0) - 3, coordinates.max(0) + 4
        cropped = mask[tuple(slice(a, b) for a, b in zip(lower, upper))].astype("f4")
        vertices, faces, _, _ = marching_cubes(gaussian_filter(cropped, 0.65), 0.5)
        vertices = nib.affines.apply_affine(img.header.get_vox2ras_tkr(), vertices + lower)
        volume = np.einsum("ij,ij->i", vertices[faces[:, 0]], np.cross(vertices[faces[:, 1]], vertices[faces[:, 2]])).sum() / 6
        if volume < 0:
            faces = faces[:, [0, 2, 1]]
        positions.append(vertices.astype("<f4"))
        indices.append(faces.astype("<u4").ravel())
        parts.append({
            "id": identifier, "name": name, "kind": kind, "labels": labels,
            "vertexOffset": vertex_offset, "indexOffset": index_offset,
            "vertices": len(vertices), "triangles": len(faces),
            "boundsRAS": [vertices.min(0).tolist(), vertices.max(0).tolist()],
        })
        vertex_offset += len(vertices)
        index_offset += faces.size
    target = Path(__file__).resolve().parents[1] / "assets"
    payload = struct.pack("<4I", 0x44535431, vertex_offset, index_offset, len(parts))
    payload += np.concatenate(positions).tobytes() + np.concatenate(indices).tobytes()
    (target / "deep-structures.bin").write_bytes(payload)
    metadata = {
        "source": SOURCE, "commit": COMMIT, "sourceSha256": source_digest,
        "coordinateSystem": "FreeSurfer tkregister RAS, millimetres",
        "processing": "aseg labels; Gaussian sigma 0.65 voxel; marching cubes at 0.5; outward face winding; cerebellar cortex and white matter united per hemisphere",
        "vertices": vertex_offset, "triangles": index_offset // 3, "parts": parts,
        "development": "colour is qualitative and illustrative; no fitted maturity curves; adult geometry is fixed",
    }
    (target / "deep-structures-source.json").write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n")
    print(f"Internal structures: {len(parts)} meshes, {vertex_offset} vertices, {index_offset // 3} triangles, {len(payload)} bytes")


if __name__ == "__main__":
    main()
