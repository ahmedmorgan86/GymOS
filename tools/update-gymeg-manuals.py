"""Rebuild current bilingual guides without rewriting handbook source content."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).resolve().parents[1]/'docs/manuals/build_release_current.py'),run_name='__main__')
