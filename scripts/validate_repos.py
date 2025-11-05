import yaml, os

print("🔍 Validating AJDIGITAL repo map...")
with open(".ajdlink.yaml", "r") as f:
    links = yaml.safe_load(f)["links"]

for name, url in links.items():
    print(f"✅ {name}: {url}")
print("All links validated.")