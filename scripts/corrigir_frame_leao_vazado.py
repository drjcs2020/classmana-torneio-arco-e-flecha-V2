"""Corrige SOMENTE assets/v2/frames/leao.webp: alfa no vão interno.

As máscaras da Águia e do Dragão são referências para delimitar a abertura.
Não alterar escudo, bordas, efeitos de fogo e plaquetas de nome/pontuação.
Execução idempotente; mantém o mesmo tamanho 690x920.
"""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parents[1]
folder = ROOT / "assets" / "v2" / "frames"
path = folder / "leao.webp"
reference = folder / "dragao.webp"
im = Image.open(path).convert("RGBA")
green = Image.open(reference).convert("RGBA")
if im.size != (690, 920) or green.size != im.size:
    raise SystemExit("Dimensoes das molduras inesperadas. Nao alterar o asset.")

arr = np.array(im)
ref = np.array(green)
if arr[350, 350, 3] < 30:
    print("A moldura Leao ja esta vazada: nenhuma alteracao.")
    raise SystemExit(0)

y, x = np.indices(arr.shape[:2])
# Registrar a abertura com a moldura verde transparente, no mesmo formato.
inside = (ref[:, :, 3] <= 35) & (x > 91) & (x < 601) & (y > 103) & (y < 627)
red = arr[:, :, 0].astype(float)
g = arr[:, :, 1].astype(float)
blue = arr[:, :, 2].astype(float)
# Conservar as pontas de chama e brilhos dourados; retirar o vinho opaco.
strength = np.clip((g - 33) / 68, 0, 1) * np.clip((red - 149) / 76, 0, 1)
flame_alpha = (200 * strength).astype("uint8")
flame_alpha[nd.distance_transform_edt(inside) > 94] = 0
alpha = arr[:, :, 3].copy()
alpha[inside] = np.minimum(alpha[inside], flame_alpha[inside])
alpha[inside & (alpha < 5)] = 0
arr[:, :, 3] = alpha

# Verificacoes de integridade das plaquetas, brasao e centro.
assert arr[350, 350, 3] == 0 and arr[450, 300, 3] == 0
assert arr[740, 350, 3] >= 240
assert arr[110, 540, 3] >= 240
output = Image.fromarray(arr, "RGBA")
output.save(path, "WEBP", quality=85, method=6, exact=True)
saved = Image.open(path).convert("RGBA")
assert saved.size == (690, 920) and saved.getpixel((350, 350))[3] == 0
print("Frame Leao corrigido:", path, "vazado transparente, bordas e plaquetas intactas")
