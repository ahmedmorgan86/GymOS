from pathlib import Path
p=Path('.gitignore');p.write_text(p.read_text()+'\n/windows/release-gymeg/\n/windows/store-staging/\n*.jks\n*.keystore\n*.pfx\n*.p12\n',encoding='utf-8')
p=Path('.github/workflows/quality.yml');p.write_text(p.read_text().replace('Publish PUSHTORQ Windows','Publish GYMEG Windows').replace('PUSHTORQ-Windows-x64','GYMEG-Windows-x64').replace('windows/pushtorq-release','windows/gymeg-release'),encoding='utf-8')
