"""
Custom Django CAPTCHA — estilo Google reCAPTCHA con desafío de imágenes.
100% Django/Python — sin dependencias externas de Google.

Mecanismos anti-bot:
  1. Checkbox visible que el usuario debe marcar.
  2. Al hacer clic, se muestra un desafío de imágenes (3×3 grid).
  3. Token generado por sesión y validado en el servidor.
  4. Campo honeypot oculto (los bots lo rellenan, los humanos no).
  5. Verificación de tiempo mínimo (< 2 s → rechazado).
"""

import time
import math
import hashlib
import secrets
import random
import io
import base64

from PIL import Image, ImageDraw, ImageFilter
from django import forms
from django.core.exceptions import ValidationError


# ═══════════════════════════════════════════════════════════════════
#  GENERACIÓN DE IMÁGENES CON PILLOW  — Escenas realistas
# ═══════════════════════════════════════════════════════════════════

TILE_SIZE = 150

CATEGORIES = {
    "semáforos":   "_draw_scene_traffic_light",
    "autobuses":   "_draw_scene_bus",
    "bicicletas":  "_draw_scene_bicycle",
    "casas":       "_draw_scene_house",
    "árboles":     "_draw_scene_tree",
}
CATEGORY_KEYS = list(CATEGORIES.keys())


def _sky_gradient(draw, w, h, top_color, bottom_color):
    """Dibuja un degradado de cielo."""
    for y in range(h):
        ratio = y / h
        r = int(top_color[0] + (bottom_color[0] - top_color[0]) * ratio)
        g = int(top_color[1] + (bottom_color[1] - top_color[1]) * ratio)
        b = int(top_color[2] + (bottom_color[2] - top_color[2]) * ratio)
        draw.line([(0, y), (w, y)], fill=(r, g, b))


def _add_clouds(draw, w, h):
    """Agrega nubes aleatorias."""
    for _ in range(random.randint(1, 3)):
        cx = random.randint(10, w - 10)
        cy = random.randint(8, int(h * 0.3))
        for _ in range(random.randint(3, 6)):
            rx = random.randint(12, 30)
            ry = random.randint(8, 16)
            ox = cx + random.randint(-20, 20)
            oy = cy + random.randint(-6, 6)
            draw.ellipse([ox - rx, oy - ry, ox + rx, oy + ry],
                         fill=(255, 255, 255, 200))


def _ground(draw, w, h, color, y_start=None):
    """Dibuja el suelo."""
    if y_start is None:
        y_start = int(h * 0.65)
    draw.rectangle([0, y_start, w, h], fill=color)


def _road(draw, w, h):
    """Dibuja una carretera con líneas."""
    road_y = int(h * 0.6)
    draw.rectangle([0, road_y, w, h], fill="#555555")
    # Líneas de carretera
    line_y = road_y + (h - road_y) // 2
    for x in range(0, w, 30):
        draw.rectangle([x, line_y - 1, x + 15, line_y + 1], fill="#FFD700")
    # Acera
    draw.rectangle([0, road_y - 6, w, road_y], fill="#999999")


def _draw_scene_traffic_light(draw, size):
    """Escena: semáforo en una esquina de calle."""
    w = h = size
    # Cielo
    skies = [((100, 160, 220), (180, 210, 240)),
             ((70, 130, 200), (160, 200, 235)),
             ((140, 180, 230), (200, 220, 245))]
    top, bot = random.choice(skies)
    _sky_gradient(draw, w, h, top, bot)
    _add_clouds(draw, w, h)
    _road(draw, w, h)

    # Poste
    px = random.randint(w // 4, 3 * w // 4)
    draw.rectangle([px - 3, int(h * 0.15), px + 3, int(h * 0.6)], fill="#444")

    # Caja del semáforo
    bx = px - 16
    by = int(h * 0.12)
    bw, bh = 32, int(h * 0.35)
    draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=5, fill="#222")
    draw.rounded_rectangle([bx + 1, by + 1, bx + bw - 1, by + bh - 1],
                           radius=4, outline="#333", width=1)

    # Luces con brillo
    colors_on = ["#FF2222", "#FFCC00", "#00DD00"]
    active = random.randint(0, 2)
    gap = bh // 4
    for i, c in enumerate(colors_on):
        cy_ = by + gap * (i + 1)
        cx_ = px
        brightness = 1.0 if i == active else 0.3
        r, g, b = int(int(c[1:3], 16) * brightness), int(int(c[3:5], 16) * brightness), int(int(c[5:7], 16) * brightness)
        # Halo
        if i == active:
            draw.ellipse([cx_ - 12, cy_ - 12, cx_ + 12, cy_ + 12],
                         fill=(r, g, b, 80))
        draw.ellipse([cx_ - 7, cy_ - 7, cx_ + 7, cy_ + 7], fill=(r, g, b))


def _draw_scene_bus(draw, size):
    """Escena: autobús en una carretera."""
    w = h = size
    top, bot = random.choice([
        ((90, 150, 210), (170, 200, 230)),
        ((120, 170, 220), (190, 215, 240))])
    _sky_gradient(draw, w, h, top, bot)
    _add_clouds(draw, w, h)
    _road(draw, w, h)

    # Bus body
    bus_colors = ["#D32F2F", "#1565C0", "#F57F17", "#2E7D32", "#6A1B9A"]
    color = random.choice(bus_colors)
    bx = random.randint(10, 30)
    by = int(h * 0.3)
    bw = w - bx - random.randint(10, 25)
    bh = int(h * 0.32)

    # Cuerpo
    draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=6, fill=color)
    # Techo
    draw.rectangle([bx + 3, by - 4, bx + bw - 3, by], fill="#333")
    # Ventanas
    win_y = by + 6
    win_h = bh // 3
    num_wins = random.randint(3, 5)
    win_w = (bw - 30) // num_wins
    for i in range(num_wins):
        wx = bx + 12 + i * (win_w + 4)
        draw.rounded_rectangle([wx, win_y, wx + win_w, win_y + win_h],
                               radius=3, fill="#B3D9FF")
        draw.rounded_rectangle([wx, win_y, wx + win_w, win_y + win_h],
                               radius=3, outline="#1a1a1a", width=1)
    # Parabrisas
    draw.rounded_rectangle([bx + bw - 22, win_y - 2, bx + bw - 4, win_y + win_h + 4],
                           radius=4, fill="#CCE5FF")
    # Ruedas
    for rx in [bx + 20, bx + bw - 22]:
        draw.ellipse([rx - 10, by + bh - 6, rx + 10, by + bh + 14], fill="#222")
        draw.ellipse([rx - 5, by + bh - 1, rx + 5, by + bh + 9], fill="#666")
    # Línea decorativa
    draw.rectangle([bx, by + bh - 8, bx + bw, by + bh - 5], fill="#FFD600")


def _draw_scene_bicycle(draw, size):
    """Escena: bicicleta en un parque."""
    w = h = size
    _sky_gradient(draw, w, h, (120, 190, 230), (200, 225, 240))
    _add_clouds(draw, w, h)
    _ground(draw, w, h, "#6B8E23", int(h * 0.65))
    # Pasto
    for _ in range(40):
        gx = random.randint(0, w)
        gy = random.randint(int(h * 0.65), h)
        draw.line([(gx, gy), (gx + random.randint(-3, 3), gy - random.randint(4, 10))],
                  fill="#556B2F", width=1)

    cx = w // 2
    cy = int(h * 0.55)
    wheel_r = int(size * 0.16)
    spacing = int(size * 0.28)

    # Ruedas
    for wx in [cx - spacing // 2, cx + spacing // 2]:
        draw.ellipse([wx - wheel_r, cy - wheel_r, wx + wheel_r, cy + wheel_r],
                     outline="#333", width=2)
        # Rayos
        for a in range(0, 360, 45):
            sx = wx + int(wheel_r * 0.9 * math.cos(math.radians(a)))
            sy = cy + int(wheel_r * 0.9 * math.sin(math.radians(a)))
            draw.line([(wx, cy), (sx, sy)], fill="#555", width=1)
        draw.ellipse([wx - 3, cy - 3, wx + 3, cy + 3], fill="#333")

    # Cuadro
    frame_color = random.choice(["#D32F2F", "#1565C0", "#2E7D32", "#F57F17"])
    rw = cx + spacing // 2
    lw = cx - spacing // 2
    seat_y = cy - wheel_r - 5
    draw.line([(lw, cy), (cx, seat_y)], fill=frame_color, width=3)
    draw.line([(cx, seat_y), (rw, cy)], fill=frame_color, width=3)
    draw.line([(cx, seat_y), (cx - 5, cy)], fill=frame_color, width=3)
    draw.line([(lw, cy), (cx + 5, cy)], fill=frame_color, width=2)
    # Manillar
    draw.line([(rw, cy), (rw + 4, cy - wheel_r - 2)], fill="#333", width=2)
    draw.line([(rw, cy - wheel_r - 2), (rw + 8, cy - wheel_r - 2)], fill="#333", width=2)
    # Silla
    draw.rounded_rectangle([cx - 8, seat_y - 5, cx + 8, seat_y],
                           radius=2, fill="#333")


def _draw_scene_house(draw, size):
    """Escena: casa con jardín."""
    w = h = size
    _sky_gradient(draw, w, h, (100, 170, 230), (180, 215, 245))
    _add_clouds(draw, w, h)
    _ground(draw, w, h, "#5B8C30", int(h * 0.6))

    # Casa
    wall_colors = ["#F5DEB3", "#FFDAB9", "#E8D4A2", "#D4A574", "#C4A882"]
    roof_colors = ["#8B0000", "#A0522D", "#6B3A2A", "#4A2520", "#7B3B2E"]
    wall = random.choice(wall_colors)
    roof = random.choice(roof_colors)

    hx = int(w * 0.15)
    hw = int(w * 0.7)
    hy = int(h * 0.3)
    hh = int(h * 0.32)

    # Paredes
    draw.rectangle([hx, hy, hx + hw, hy + hh], fill=wall, outline="#8B7355", width=1)
    # Techo
    draw.polygon([(hx - 8, hy), (hx + hw + 8, hy), (w // 2, hy - int(h * 0.2))],
                 fill=roof, outline="#5B3A1A", width=1)
    # Puerta
    dx = w // 2 - 10
    draw.rounded_rectangle([dx, hy + hh - 35, dx + 20, hy + hh],
                           radius=3, fill="#5D3A1A", outline="#3B2010", width=1)
    draw.ellipse([dx + 14, hy + hh - 20, dx + 17, hy + hh - 17], fill="#DAA520")
    # Ventanas
    for vx in [hx + 12, hx + hw - 32]:
        draw.rectangle([vx, hy + 10, vx + 20, hy + 26], fill="#87CEEB", outline="#5B3A1A", width=1)
        draw.line([(vx + 10, hy + 10), (vx + 10, hy + 26)], fill="#5B3A1A", width=1)
        draw.line([(vx, hy + 18), (vx + 20, hy + 18)], fill="#5B3A1A", width=1)

    # Mini árboles decorativos
    for tx in [hx - 10, hx + hw + 5]:
        draw.rectangle([tx + 5, int(h * 0.45), tx + 9, int(h * 0.6)], fill="#5D3A1A")
        draw.ellipse([tx - 5, int(h * 0.3), tx + 18, int(h * 0.5)], fill="#2E7D32")


def _draw_scene_tree(draw, size):
    """Escena: árbol grande en paisaje."""
    w = h = size
    _sky_gradient(draw, w, h,
                  random.choice([(100, 170, 230), (140, 180, 220), (80, 140, 200)]),
                  (190, 220, 245))
    _add_clouds(draw, w, h)
    _ground(draw, w, h, random.choice(["#5B8C30", "#6B8E23", "#4A7C20"]), int(h * 0.6))

    cx = w // 2 + random.randint(-15, 15)
    # Tronco con textura
    tw = random.randint(10, 16)
    trunk_top = int(h * 0.35)
    trunk_bot = int(h * 0.65)
    draw.rectangle([cx - tw, trunk_top, cx + tw, trunk_bot], fill="#6B4226")
    draw.rectangle([cx - tw + 2, trunk_top, cx - tw + 4, trunk_bot], fill="#5B3620")
    draw.rectangle([cx + tw - 4, trunk_top, cx + tw - 2, trunk_bot], fill="#5B3620")

    # Copa con múltiples círculos superpuestos
    greens = ["#2E7D32", "#388E3C", "#43A047", "#1B5E20", "#4CAF50"]
    for _ in range(random.randint(8, 14)):
        r = random.randint(18, 35)
        ox = cx + random.randint(-30, 30)
        oy = int(h * 0.25) + random.randint(-20, 15)
        draw.ellipse([ox - r, oy - r, ox + r, oy + r], fill=random.choice(greens))

    # Sombra en el suelo
    draw.ellipse([cx - 35, int(h * 0.63), cx + 35, int(h * 0.7)],
                 fill="#4A6B20")


def _draw_scene_distractor(draw, size):
    """Escena distractor: paisaje urbano sin objeto target."""
    w = h = size
    scenes = [_distractor_street, _distractor_park, _distractor_sky]
    random.choice(scenes)(draw, w, h)


def _distractor_street(draw, w, h):
    """Calle vacía."""
    _sky_gradient(draw, w, h, (130, 170, 210), (190, 210, 230))
    _road(draw, w, h)
    # Edificios al fondo
    for _ in range(random.randint(2, 4)):
        bx = random.randint(0, w - 40)
        bw = random.randint(25, 50)
        bh = random.randint(int(h * 0.15), int(h * 0.4))
        by = int(h * 0.6) - bh
        c = random.choice(["#B0BEC5", "#90A4AE", "#78909C", "#CFD8DC"])
        draw.rectangle([bx, by, bx + bw, int(h * 0.6)], fill=c, outline="#607D8B", width=1)
        # Ventanas
        for wy in range(by + 5, int(h * 0.6) - 5, 12):
            for wx in range(bx + 4, bx + bw - 4, 10):
                draw.rectangle([wx, wy, wx + 6, wy + 7], fill="#FFF9C4")


def _distractor_park(draw, w, h):
    """Parque."""
    _sky_gradient(draw, w, h, (100, 180, 240), (200, 230, 250))
    _add_clouds(draw, w, h)
    _ground(draw, w, h, "#5B8C30", int(h * 0.55))
    # Arbustos
    for _ in range(random.randint(3, 6)):
        bx = random.randint(5, w - 20)
        by = random.randint(int(h * 0.5), int(h * 0.7))
        r = random.randint(10, 22)
        draw.ellipse([bx - r, by - r, bx + r, by + r],
                     fill=random.choice(["#2E7D32", "#4CAF50", "#388E3C"]))
    # Camino
    draw.rectangle([w // 2 - 15, int(h * 0.55), w // 2 + 15, h], fill="#C4A882")


def _distractor_sky(draw, w, h):
    """Solo cielo con nubes."""
    tops = [(60, 120, 200), (100, 160, 220), (70, 100, 170)]
    bots = [(150, 200, 240), (180, 215, 245), (140, 180, 220)]
    idx = random.randint(0, len(tops) - 1)
    _sky_gradient(draw, w, h, tops[idx], bots[idx])
    _add_clouds(draw, w, h)
    # Edificios lejanos o montañas
    for i in range(random.randint(3, 6)):
        mx = random.randint(-20, w)
        mw = random.randint(40, 80)
        mh = random.randint(int(h * 0.3), int(h * 0.5))
        c = random.choice(["#7986CB", "#9FA8DA", "#5C6BC0"])
        draw.polygon([(mx, h), (mx + mw // 2, h - mh), (mx + mw, h)], fill=c)
    _ground(draw, w, h, "#6B8E23", int(h * 0.75))


def _generate_tile(draw_func_name):
    """Genera una imagen 150×150 con una escena."""
    img = Image.new("RGB", (TILE_SIZE, TILE_SIZE), (200, 200, 200))
    draw = ImageDraw.Draw(img)

    if draw_func_name == "_distractor":
        _draw_scene_distractor(draw, TILE_SIZE)
    else:
        func = globals()[draw_func_name]
        func(draw, TILE_SIZE)

    # Añadir ligero ruido/textura para que se vea más fotográfico
    noise_img = Image.new("RGB", (TILE_SIZE, TILE_SIZE))
    noise_draw = ImageDraw.Draw(noise_img)
    for x in range(0, TILE_SIZE, 3):
        for y in range(0, TILE_SIZE, 3):
            v = random.randint(-8, 8)
            noise_draw.point((x, y), fill=(128 + v, 128 + v, 128 + v))
    img = Image.blend(img, noise_img, 0.03)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def generate_challenge(request):
    """
    Genera un desafío de 9 imágenes (3×3).
    Devuelve: { prompt, images: [base64...], target_indices: [int...], challenge_id }
    y guarda la respuesta correcta en la sesión.
    """
    if not request.session.session_key:
        request.session.create()

    target_cat = random.choice(CATEGORY_KEYS)
    draw_func = CATEGORIES[target_cat]

    # Decidimos cuántas serán del target (2–4)
    n_targets = random.randint(2, 4)
    # Las otras categorías para distractores (excluir la target)
    other_cats = [k for k in CATEGORY_KEYS if k != target_cat]

    tiles = []   # (index, is_target, base64_img)
    indices = list(range(9))
    target_indices = sorted(random.sample(indices, n_targets))

    for i in range(9):
        if i in target_indices:
            img_b64 = _generate_tile(draw_func)
            tiles.append(img_b64)
        else:
            # 60% otra categoría concreta, 40% distractor abstracto
            if random.random() < 0.6 and other_cats:
                other_func = CATEGORIES[random.choice(other_cats)]
                img_b64 = _generate_tile(other_func)
            else:
                img_b64 = _generate_tile("_distractor")
            tiles.append(img_b64)

    challenge_id = secrets.token_hex(16)
    request.session["captcha_challenge"] = {
        "id": challenge_id,
        "target": target_indices,
        "ts": time.time(),
    }
    request.session.modified = True

    return {
        "challenge_id": challenge_id,
        "prompt_pre": "Selecciona todas las imágenes con",
        "prompt_target": target_cat,
        "prompt_post": "Haz clic en verificar cuando no quede ninguna.",
        "images": tiles,
    }


def verify_challenge(request, challenge_id, selected_indices):
    """
    Verifica que los índices seleccionados coincidan con los del target.
    Devuelve True/False. Si es True, marca la sesión como verificada.
    """
    data = request.session.get("captcha_challenge")
    if not data or data["id"] != challenge_id:
        return False

    # Tiempo mínimo — muy rápido = bot
    if time.time() - data["ts"] < 2:
        return False

    correct = sorted(data["target"])
    if sorted(selected_indices) == correct:
        # Marcar captcha como resuelto
        token = _generate_token(request.session.session_key)
        request.session["captcha_token"] = token
        request.session["captcha_ts"] = time.time()
        request.session["captcha_verified"] = True
        # Limpiar challenge
        del request.session["captcha_challenge"]
        request.session.modified = True
        return token  # Devolvemos el token para ponerlo en el hidden field

    return False


# ═══════════════════════════════════════════════════════════════════
#  HELPERS DE TOKEN (sin cambio)
# ═══════════════════════════════════════════════════════════════════

def _generate_token(session_key: str) -> str:
    salt = secrets.token_hex(8)
    raw = f"{session_key}-{salt}-captcha"
    digest = hashlib.sha256(raw.encode()).hexdigest()[:32]
    return f"{salt}:{digest}"


def _verify_token(token: str, session_token: str) -> bool:
    return token and session_token and token == session_token


# ═══════════════════════════════════════════════════════════════════
#  WIDGET Y FIELD (sin cambio significativo)
# ═══════════════════════════════════════════════════════════════════

class RobotCheckboxWidget(forms.MultiWidget):
    template_name = "usuarios/captcha_widget.html"

    def __init__(self, attrs=None):
        widgets = [
            forms.HiddenInput(attrs={"class": "captcha-token"}),
            forms.TextInput(attrs={
                "tabindex": "-1",
                "autocomplete": "off",
                "style": "position:absolute;left:-9999px;opacity:0;height:0;width:0;",
            }),
        ]
        super().__init__(widgets, attrs)

    def decompress(self, value):
        if value:
            parts = value.split("|", 1)
            return parts if len(parts) == 2 else [value, ""]
        return ["", ""]


class RobotCheckboxField(forms.Field):
    widget = RobotCheckboxWidget

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("label", "")
        kwargs.setdefault("error_messages", {
            "required": "Debes confirmar que no eres un robot.",
            "invalid": "Verificación fallida. Intenta de nuevo.",
            "bot_detected": "Actividad sospechosa detectada.",
        })
        super().__init__(*args, **kwargs)

    def validate_captcha(self, token_value, honeypot_value, request):
        if honeypot_value:
            raise ValidationError(
                self.error_messages["bot_detected"], code="bot_detected",
            )
        session_token = request.session.get("captcha_token", "")
        if not _verify_token(token_value, session_token):
            raise ValidationError(
                self.error_messages["invalid"], code="invalid",
            )
        if time.time() - request.session.get("captcha_ts", 0) < 2:
            raise ValidationError(
                self.error_messages["bot_detected"], code="bot_detected",
            )
        return True

    def clean(self, value):
        if isinstance(value, (list, tuple)):
            token = value[0] if len(value) > 0 else ""
            honeypot = value[1] if len(value) > 1 else ""
        else:
            token = value or ""
            honeypot = ""
        if not token:
            raise ValidationError(
                self.error_messages["required"], code="required",
            )
        return {"token": token, "honeypot": honeypot}


# ═══════════════════════════════════════════════════════════════════
#  HELPERS PARA VISTAS
# ═══════════════════════════════════════════════════════════════════

def captcha_init(request):
    """Genera un token nuevo y lo guarda en sesión. Devuelve el token."""
    if not request.session.session_key:
        request.session.create()
    # Resetear estado verificado para forzar nuevo desafío
    request.session["captcha_verified"] = False
    token = _generate_token(request.session.session_key)
    request.session["captcha_token"] = token
    request.session["captcha_ts"] = time.time()
    return token
