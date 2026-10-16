"""Stage the previously accepted CI ZIP; never rebuild extension bytes."""
import hashlib
import json
from pathlib import Path
import shutil
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[2]
SOURCE = "5e3dc52bc54630753cf37619225be49d42043a2d"
WRAPPER_SHA = "00fae5a5479e058430fe5ee3ce0e405bcd6bdd50b83bd31d76aa36cbcb7ffd98"
ZIP_SHA = "6f29e93c4cd02c9f48e4cde3f6ded408c7a822449998b6416e2c9ccd430ab74c"
ZIP_NAME = "DropShredder-0.2.0-beta.1-chrome.zip"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def verified_payload(data, build):
    assert digest(data) == ZIP_SHA, "Accepted install ZIP digest differs"
    assert len(data) == 25_849_056, "Accepted install ZIP size differs"
    assert build["sourceCommit"] == SOURCE, "Candidate source differs"
    assert build["sourceTree"] == "e5841d40c6b22a6bdd7eb685956e221eceff0bcd"
    expected = {entry["path"]: entry for entry in build["buildFiles"]}
    assert len(expected) == 51 and sum(e["bytes"] for e in expected.values()) == 54_941_299
    import io
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        files = [entry for entry in archive.infolist() if not entry.is_dir()]
        assert len(files) == len(expected) and {e.filename for e in files} == set(expected)
        for entry in files:
            content = archive.read(entry)
            assert len(content) == expected[entry.filename]["bytes"], entry.filename
            assert digest(content) == expected[entry.filename]["sha256"], entry.filename
        return {e.filename: archive.read(e) for e in files}


def main():
    wrapper = Path(sys.argv[1]).read_bytes()
    assert digest(wrapper) == WRAPPER_SHA, "CI artifact wrapper digest differs"
    import io
    with zipfile.ZipFile(io.BytesIO(wrapper)) as archive:
        files = [e for e in archive.infolist() if not e.is_dir()]
        assert len(files) == 1 and files[0].filename == "dropshredder-0.2.0-chrome.zip"
        data = archive.read(files[0])
    build = json.loads((ROOT / "tools/browser-smoke/candidate-build-info.json").read_text())
    contents = verified_payload(data, build)
    output = ROOT / ".output/chrome-mv3"
    if output.exists():
        shutil.rmtree(output)  # This exact repository-derived build directory only.
    for name, content in contents.items():
        target = output / name
        assert target.resolve().is_relative_to(output.resolve())
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
    packet = ROOT / "beta-packet"
    packet.mkdir(exist_ok=True)
    (packet / ZIP_NAME).write_bytes(data)
    (packet / "BUILD-INFO.json").write_text(json.dumps(build, indent=2) + "\n")
    (packet / "SHA256SUMS.txt").write_text(f"{ZIP_SHA}  {ZIP_NAME}\n")
    shutil.copyfile(ROOT / "BETA-TESTING.md", packet / "INSTALL-AND-REPORT.md")
    print(json.dumps({"status": "VERIFIED_EXACT_ARTIFACT", "sourceCommit": SOURCE,
                      "files": 51, "bytes": 54_941_299, "zipSha256": ZIP_SHA}))


if __name__ == "__main__":
    main()
