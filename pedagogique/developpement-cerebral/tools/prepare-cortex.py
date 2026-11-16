"""Reproduce assets/cortex.bin using Python 3 (standard library only).

Source: Nilearn 0.12.1 fsaverage5 (FreeSurfer average adult pial surfaces).
Not pediatric anatomy; there are no developmental measurements in this asset.
Run from any directory: python3 tools/prepare-cortex.py
"""

import array
import base64
import gzip
from pathlib import Path
import struct
import sys
from urllib.request import urlopen
import xml.etree.ElementTree as ET
import zlib

SOURCE = "https://raw.githubusercontent.com/nilearn/nilearn/0.12.1/nilearn/datasets/data/fsaverage5/"


def read_gifti(filename):
    with urlopen(SOURCE + filename, timeout=30) as response:
        root = ET.fromstring(gzip.decompress(response.read()))
    arrays = {}
    for data in root.findall("DataArray"):
        kind = "f" if data.attrib["DataType"] == "NIFTI_TYPE_FLOAT32" else "i"
        values = array.array(kind)
        values.frombytes(zlib.decompress(base64.b64decode(data.findtext("Data"))))
        if sys.byteorder != "little":
            values.byteswap()
        arrays[data.attrib["Intent"]] = values
    return arrays


def little_endian(values):
    if sys.byteorder != "little":
        values.byteswap()
    return values.tobytes()


def main():
    positions = array.array("f")
    depths = array.array("f")
    indices = array.array("H")
    for hemisphere in ("left", "right"):
        pial = read_gifti(f"pial_{hemisphere}.gii.gz")
        sulc = read_gifti(f"sulc_{hemisphere}.gii.gz")
        offset = len(positions) // 3
        positions.extend(pial["NIFTI_INTENT_POINTSET"])
        depths.extend(sulc["NIFTI_INTENT_SHAPE"])
        indices.extend(i + offset for i in pial["NIFTI_INTENT_TRIANGLE"])
    vertex_count = len(positions) // 3
    assert vertex_count == len(depths) == 20484
    assert len(indices) == 122880 and max(indices) < vertex_count
    header = struct.pack("<4I", 0x42524E31, vertex_count, len(indices), 0)
    target = Path(__file__).resolve().parents[1] / "assets" / "cortex.bin"
    target.parent.mkdir(exist_ok=True)
    target.write_bytes(header + little_endian(positions) + little_endian(depths) + little_endian(indices))
    print(f"{target.name}: {vertex_count} vertices, {len(indices) // 3} triangles, {target.stat().st_size} bytes")


if __name__ == "__main__":
    main()
