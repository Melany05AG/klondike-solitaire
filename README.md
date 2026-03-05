# 🃏 Solitario Klondike

Implementación completa del clásico juego de cartas **Solitario Klondike** en el navegador, desarrollada con programación orientada a objetos en JavaScript Vanilla puro.

## 🎮 Demo

Abrí `index.html` directamente en tu navegador — no requiere servidor ni instalación.

## ✨ Características

- **Drag & Drop** — Arrastrá cartas entre columnas y fundaciones
- **Click para mover** — Hacé clic en una carta para seleccionarla y luego clic en el destino
- **Doble clic** — Manda automáticamente una carta a su fundación correspondiente
- **Cronómetro en tiempo real** — Registra el tiempo de la partida en formato MM:SS
- **Contador de movimientos** — Lleva el registro de cuántos movimientos realizaste
- **Historial de movimientos** — Guarda los últimos 50 estados del juego
- **Auto-volteo** — Las cartas se voltean automáticamente al quedar expuestas
- **Reciclaje del mazo** — Cuando el stock se agota, se puede reciclar el descarte
- **Pantalla de victoria** — Muestra movimientos y tiempo total al ganar

## 🕹️ Cómo jugar

1. Hacé clic en el **mazo** (esquina superior izquierda) para robar una carta
2. **Arrastrá** o **hacé clic** en las cartas para moverlas
3. En las columnas apilá cartas de **color alternado** en orden **descendente**
4. En las **fundaciones** (♥️ ♦️ ♣️ ♠️) apilá cartas del mismo palo de **A hasta K**
5. Columnas vacías solo aceptan **Reyes**
6. ¡Completá las 4 fundaciones para ganar!

## 🛠️ Tecnologías

- JavaScript ES6+ (Clases, Arrow Functions, Spread Operator)
- HTML5 (Drag & Drop API)
- CSS3
- Sin dependencias externas

## 🚀 Uso

```bash
git clone https://github.com/tu-usuario/klondike-solitaire.git
cd klondike-solitaire

# Abrir directamente en el navegador
# No requiere servidor ni npm install
```

## 📁 Estructura del proyecto

```
solitario/
├── index.html          # Interfaz del juego
├── css/
│   └── style.css       # Estilos del tablero, cartas y animaciones
├── js/
│   └── juego.js        # Lógica completa del juego (clase JuegoSolitario)
└── cartas/
    ├── card_back.png   # Reverso de las cartas
    ├── AC.png          # As de Corazones
    ├── KC.png          # Rey de Corazones
    └── ...             # 52 cartas en PNG (nombradas como ValorPalo)
```

## 🏗️ Arquitectura

El juego está implementado como una única clase `JuegoSolitario` con responsabilidades claras:

| Método | Responsabilidad |
|--------|----------------|
| `crearMazo()` | Genera las 52 cartas y las mezcla con Fisher-Yates |
| `inicializarJuego()` | Distribuye las cartas según las reglas del Klondike |
| `puedesMoverCartas()` | Valida movimientos según las reglas del juego |
| `moverCartas()` | Ejecuta el movimiento y actualiza el estado |
| `verificarCondicionVictoria()` | Detecta cuando las 4 fundaciones están completas |
| `guardarMovimiento()` | Guarda el estado para poder deshacer |
| `actualizarVisualizacion()` | Sincroniza el DOM con el estado del juego |
| `destruir()` | Limpia timers y event listeners (evita memory leaks) |

## 👥 Autora

- Melany Arias Guadamuz

## 📄 Licencia

Este proyecto fue desarrollado con fines académicos.
