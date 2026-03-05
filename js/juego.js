//Clase principal
class JuegoSolitario {
  constructor() {
      // Estructuras de datos principales del juego
      this.mazo = [];           // Mazo completo de 52 cartas
      this.stock = [];          // Cartas boca abajo en la esquina superior izquierda
      this.descarte = [];       // Cartas boca arriba sacadas del stock
      this.bases = [[], [], [], []];    // Las 4 pilas de fundación (A-K por palo)
      this.tablero = [[], [], [], [], [], [], []]; // Las 7 columnas del tablero principal
      
      // Variables de control del juego
      this.movimientos = 0;           // Contador de movimientos realizados
      this.tiempoInicio = Date.now(); // Momento de inicio para el cronómetro
      this.juegoGanado = false;       // Estado de victoria
      this.cartasSeleccionadas = []; // Cartas actualmente seleccionadas por el jugador
      this.cartasArrastradas = [];   // Cartas siendo arrastradas (drag & drop)
      this.historialMovimientos = []; // Historial para deshacer movimientos
      this.autoJugar = false;        // Modo de juego automático
      this.intervalId = null;        // ID del temporizador
                
      // Configuración de las cartas
      this.palos = ['corazones', 'diamantes', 'treboles', 'picas'];
      this.mapaSimbolos = { corazones: 'C', diamantes: 'D', treboles: 'T', picas: 'P' };
      this.simbolosPalos = { corazones: '♥', diamantes: '♦', treboles: '♣', picas: '♠' };
      this.coloresPalos = { corazones: 'rojo', diamantes: 'rojo', treboles: 'negro', picas: 'negro' };
      this.valores = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      
      // Vincular métodos de eventos para mantener el contexto correcto
      this.manejarInicioArraste = this.manejarInicioDrag.bind(this);
      this.manejarSobreArraste = this.manejarSobreDrag.bind(this);
      this.manejarSoltar = this.manejarSoltar.bind(this);
      this.manejarFinArraste = this.manejarFinDrag.bind(this);
      this.manejarClic = this.manejarClic.bind(this);
      this.manejarDobleClic = this.manejarDobleClic.bind(this);
                
      // Inicializar el juego
      this.inicializarJuego();
      this.iniciarTemporizador();
      this.configurarEventListeners();
  }

  /**
   * Crea un mazo completo de 52 cartas
   * Cada carta tiene: palo, valor, rango, color, estado (cara arriba/abajo) e ID único
   */
  crearMazo() {
    this.mazo = [];
    for (let palo of this.palos) {
        for (let i = 0; i < this.valores.length; i++) {
          this.mazo.push({
            palo,                           // corazones, diamantes, etc.
            valor: this.valores[i],         // A, 2, 3, ..., K
            rango: i + 1,                   // 1-13 para comparaciones numéricas
            color: this.coloresPalos[palo], // rojo o negro
            caraArriba: false,              // inicialmente todas boca abajo
            id: `${palo}-${this.valores[i]}` // identificador único
          });
        }
    }
    this.mezclarMazo();
  }

  /**
   * Mezcla las cartas del mazo usando el algoritmo Fisher-Yates
   * Garantiza una distribución aleatoria uniforme
   */
  mezclarMazo() {
    for (let i = this.mazo.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.mazo[i], this.mazo[j]] = [this.mazo[j], this.mazo[i]];
    }
  }

  /**
   * Inicializa un nuevo juego desde cero
   * Resetea todas las variables y distribuye las cartas según las reglas del Solitario
   */
  inicializarJuego() {
      this.crearMazo();
      this.stock = [...this.mazo];  // Copia todas las cartas al stock
      this.descarte = [];
      this.bases = [[], [], [], []];
      this.tablero = [[], [], [], [], [], [], []];
      this.movimientos = 0;
      this.juegoGanado = false;
      this.cartasSeleccionadas = [];
      this.historialMovimientos = [];
      this.tiempoInicio = Date.now();

      // Distribuir cartas en el tablero (1 en la primera columna, 2 en la segunda, etc.)
      for (let col = 0; col < 7; col++) {
          for (let row = 0; row <= col; row++) {
              const carta = this.stock.pop();
              // Solo la carta superior de cada columna se pone boca arriba
              if (row === col) {
                  carta.caraArriba = true;
              }
              this.tablero[col].push(carta);
          }
      }

      this.actualizarVisualizacion();
  }

  /**
   * Configura todos los event listeners para mouse, teclado y drag & drop
   * Primero remueve listeners existentes para evitar duplicados
   */
  configurarEventListeners() {
      this.removerEventListeners();
      
      // Eventos de drag & drop
      document.addEventListener('dragstart', this.manejarInicioArraste);
      document.addEventListener('dragover', this.manejarSobreArraste);
      document.addEventListener('drop', this.manejarSoltar);
      document.addEventListener('dragend', this.manejarFinArraste);
      
      // Eventos de mouse
      document.addEventListener('click', this.manejarClic);
      document.addEventListener('dblclick', this.manejarDobleClic);
  }

  /**
   * Remueve todos los event listeners para limpiar memoria
   * Importante para evitar memory leaks al crear nuevos juegos
   */
  removerEventListeners() {
      document.removeEventListener('dragstart', this.manejarInicioArraste);
      document.removeEventListener('dragover', this.manejarSobreArraste);
      document.removeEventListener('drop', this.manejarSoltar);
      document.removeEventListener('dragend', this.manejarFinArraste);
      
      document.removeEventListener('click', this.manejarClic);
      document.removeEventListener('dblclick', this.manejarDobleClic);
  }

  /**
   * Maneja todos los clics del mouse en el juego
   * Lógica principal de selección y movimiento de cartas
   */
  manejarClic(e) {
      const carta = e.target.closest('.carta');
      if (!carta) {
          // Si no se hizo clic en una carta, limpiar selección
          this.limpiarSeleccion();
          return;
      }

      const datosCarta = this.obtenerCartaDeElemento(carta);
      if (!datosCarta) return;

      // Si la carta está boca abajo en el tablero, intentar voltearla
      if (!datosCarta.caraArriba && this.esCartaEnTablero(datosCarta)) {
          const ubicacion = this.encontrarUbicacionCarta(datosCarta);
          if (ubicacion) {
              const columna = this.tablero[ubicacion.indice];
              // Solo se puede voltear si es la carta superior de la columna
              if (columna.indexOf(datosCarta) === columna.length - 1) {
                  this.voltearCarta(datosCarta);
              }
              return;
          }
      }

      // Solo procesar cartas boca arriba
      if (!datosCarta.caraArriba) return;

      if (this.cartasSeleccionadas.length === 0) {
          // Primera selección: seleccionar la carta y sus dependientes
          this.seleccionarCartas(datosCarta);
      } else {
          // Ya hay cartas seleccionadas: intentar mover al destino
          const destino = this.obtenerDestinoSoltar(e.target);
          if (destino && this.puedesMoverCartas(this.cartasSeleccionadas, destino)) {
              this.moverCartas(this.cartasSeleccionadas, destino);
              this.limpiarSeleccion();
          } else {
              // Movimiento inválido: cambiar selección
              this.limpiarSeleccion();
              this.seleccionarCartas(datosCarta);
          }
      }
  }

  /**
   * Maneja doble clic para auto-mover una carta a las bases si es posible
   * Funcionalidad de conveniencia para movimientos obvios
   */
  manejarDobleClic(e) {
      const carta = e.target.closest('.carta');
      if (!carta) return;

      const datosCarta = this.obtenerCartaDeElemento(carta);
      if (!datosCarta || !datosCarta.caraArriba) return;

      this.intentarAutoMoverABase(datosCarta);
  }

  /**
   * Intenta mover automáticamente una carta a cualquier base válida
   * Útil para acelerar el juego cuando hay movimientos obvios
   */
  intentarAutoMoverABase(carta) {
      for (let i = 0; i < 4; i++) {
          const base = this.bases[i];
          if (this.puedeMoverABase(carta, base)) {
              const origen = this.encontrarUbicacionCarta(carta);
              this.moverCartas([carta], { tipo: 'base', indice: i });
              break;
          }
      }
  }

  /**
   * Selecciona una carta y todas las cartas válidas que la siguen
   * En el tablero, permite seleccionar secuencias descendentes alternadas
   */
  seleccionarCartas(cartaInicial) {
      const ubicacion = this.encontrarUbicacionCarta(cartaInicial);
      if (!ubicacion) return;

      this.cartasSeleccionadas = [];

      if (ubicacion.tipo === 'tablero') {
          // En el tablero, seleccionar desde la carta hasta el final de la columna
          const columna = this.tablero[ubicacion.indice];
          const indiceCarta = columna.indexOf(cartaInicial);
          for (let i = indiceCarta; i < columna.length; i++) {
              if (columna[i].caraArriba) {
                  this.cartasSeleccionadas.push(columna[i]);
              }
          }
      } else if (ubicacion.tipo === 'descarte' || ubicacion.tipo === 'base') {
          // En descarte o bases, solo seleccionar la carta individual
          this.cartasSeleccionadas = [cartaInicial];
      }

      this.actualizarVisualizacionCartas();
  }

  /**
   * Limpia la selección actual de cartas
   * Actualiza la visualización para remover resaltados
   */
  limpiarSeleccion() {
      this.cartasSeleccionadas = [];
      this.actualizarVisualizacionCartas();
  }

  /**
   * Voltea una carta boca arriba
   * Incrementa contador de movimientos y actualiza la visualización
   */
  voltearCarta(carta) {
      carta.caraArriba = true;
      this.movimientos++;
      this.actualizarVisualizacion();
      this.guardarMovimiento();
  }

  /**
   * Determina si un conjunto de cartas puede moverse a un destino específico
   * Aplica las reglas del Solitario según el tipo de destino
   */
  puedesMoverCartas(cartas, destino) {
      if (!cartas.length) return false;

      const primeraCarta = cartas[0];

      if (destino.tipo === 'base') {
          // A las bases solo se puede mover una carta a la vez
          if (cartas.length > 1) return false;
          return this.puedeMoverABase(primeraCarta, this.bases[destino.indice]);
      } else if (destino.tipo === 'tablero') {
          return this.puedeMoverATablero(cartas, this.tablero[destino.indice]);
      }

      return false;
  }

  /**
   * Verifica si una carta puede moverse a una base específica
   * Reglas: mismo palo, secuencia ascendente (A, 2, 3, ..., K)
   */
  puedeMoverABase(carta, base) {
      const paloBase = ['corazones', 'diamantes', 'treboles', 'picas'][this.bases.indexOf(base)];
      
      // Debe ser del mismo palo
      if (carta.palo !== paloBase) return false;

      if (base.length === 0) {
          // Base vacía: solo acepta As (rango 1)
          return carta.rango === 1;
      } else {
          // Base con cartas: debe ser el siguiente número en secuencia
          const cartaSuperior = base[base.length - 1];
          return carta.rango === cartaSuperior.rango + 1;
      }
  }

  /**
   * Verifica si un conjunto de cartas puede moverse a una columna del tablero
   * Reglas: solo Rey en columna vacía, secuencia descendente alternando colores
   */
  puedeMoverATablero(cartas, columnaDestino) {
      const primeraCarta = cartas[0];

      if (columnaDestino.length === 0) {
          // Columna vacía: solo acepta Rey (rango 13)
          return primeraCarta.rango === 13;
      } else {
          // Columna con cartas: debe ser color opuesto y un rango menor
          const cartaSuperior = columnaDestino[columnaDestino.length - 1];
          return primeraCarta.color !== cartaSuperior.color && 
                 primeraCarta.rango === cartaSuperior.rango - 1;
      }
  }

  /**
   * Ejecuta el movimiento de cartas desde origen a destino
   * Maneja la lógica de remoción del origen, adición al destino, y volteo automático
   */
  moverCartas(cartas, destino) {
      // Encontrar las ubicaciones de origen de todas las cartas
      const ubicacionesOrigen = cartas.map(carta => this.encontrarUbicacionCarta(carta));
      
      // Remover cartas de sus ubicaciones de origen
      ubicacionesOrigen.forEach((ubicacion, indice) => {
          if (ubicacion.tipo === 'descarte') {
              this.descarte.splice(this.descarte.indexOf(cartas[indice]), 1);
          } else if (ubicacion.tipo === 'tablero') {
              this.tablero[ubicacion.indice].splice(this.tablero[ubicacion.indice].indexOf(cartas[indice]), 1);
          } else if (ubicacion.tipo === 'base') {
              this.bases[ubicacion.indice].pop();
          }
      });

      // Agregar cartas al destino
      if (destino.tipo === 'base') {
          this.bases[destino.indice].push(cartas[0]);
      } else if (destino.tipo === 'tablero') {
          this.tablero[destino.indice].push(...cartas);
      }

      // Voltear automáticamente cartas que quedan expuestas en el tablero
      ubicacionesOrigen.forEach(ubicacion => {
          if (ubicacion.tipo === 'tablero') {
              const columna = this.tablero[ubicacion.indice];
              if (columna.length > 0) {
                  const cartaSuperior = columna[columna.length - 1];
                  if (!cartaSuperior.caraArriba) {
                      cartaSuperior.caraArriba = true;
                  }
              }
          }
      });

      // Actualizar estado del juego
      this.movimientos++;
      this.guardarMovimiento();
      this.actualizarVisualizacion();
      this.verificarCondicionVictoria();
  }

  /**
   * Encuentra la ubicación actual de una carta específica
   * Busca en descarte, tablero y bases
   */
  encontrarUbicacionCarta(carta) {
      // Buscar en descarte
      if (this.descarte.includes(carta)) {
          return { tipo: 'descarte', indice: -1 };
      }
      
      // Buscar en tablero
      for (let i = 0; i < this.tablero.length; i++) {
          if (this.tablero[i].includes(carta)) {
              return { tipo: 'tablero', indice: i };
          }
      }
      
      // Buscar en bases
      for (let i = 0; i < this.bases.length; i++) {
          if (this.bases[i].includes(carta)) {
              return { tipo: 'base', indice: i };
          }
      }

      return null;
  }

  /**
   * Determina el destino de drop basado en el elemento DOM
   * Identifica si es una base o columna del tablero
   */
  obtenerDestinoSoltar(elemento) {
      const base = elemento.closest('.fundacion');
      if (base) {
          return { tipo: 'base', indice: parseInt(base.dataset.fundacion) };
      }

      const columnaTablero = elemento.closest('.columna-tablero');
      if (columnaTablero) {
          return { tipo: 'tablero', indice: parseInt(columnaTablero.dataset.columna) };
      }

      return null;
  }

  /**
   * Obtiene los datos de una carta a partir de su elemento DOM
   * Utiliza el ID de la carta para encontrarla en el mazo
   */
  obtenerCartaDeElemento(elemento) {
      const cartaId = elemento.dataset.cardId;
      if (!cartaId) return null;
      
      for (let carta of this.mazo) {
          if (carta.id === cartaId) {
              return carta;
          }
      }
      return null;
  }

  /**
   * Verifica si una carta específica está en el tablero principal
   * (no en stock, descarte o bases)
   */
  esCartaEnTablero(carta) {
      for (let columna of this.tablero) {
          if (columna.includes(carta)) return true;
      }
      return false;
  }

  /**
   * Reparte cartas del stock al descarte
   * Si el stock está vacío, recicla las cartas del descarte
   */
  repartirCartas() {
      if (this.stock.length === 0) {
          // Reciclar: mover todas las cartas del descarte al stock
          this.stock = [...this.descarte].reverse();
          this.descarte = [];
          this.stock.forEach(carta => carta.caraArriba = false);
      } else {
          // Sacar carta del stock y ponerla en descarte
          const carta = this.stock.pop();
          carta.caraArriba = true;
          this.descarte.push(carta);
      }
      this.movimientos++;
      this.actualizarVisualizacion();
      this.guardarMovimiento();
  }

  /**
   * Guarda el estado actual del juego para poder deshacer movimientos
   * Mantiene un historial limitado de los últimos 50 movimientos
   */
  guardarMovimiento() {
      this.historialMovimientos.push({
          stock: [...this.stock],
          descarte: [...this.descarte],
          bases: this.bases.map(f => [...f]),
          tablero: this.tablero.map(col => [...col]),
          movimientos: this.movimientos - 1
      });

      // Limitar el historial para no consumir demasiada memoria
      if (this.historialMovimientos.length > 50) {
          this.historialMovimientos.shift();
      }
  }

  /**
   * Actualiza toda la visualización del juego
   * Llama a métodos específicos para cada sección de la interfaz
   */
  actualizarVisualizacion() {
      this.actualizarMontStock();
      this.actualizarMontDescarte();
      this.actualizarBases();
      this.actualizarTablero();
      this.actualizarMarcador();
      this.actualizarVisualizacionCartas();
  }

  /**
   * Actualiza la visualización del mont de stock (cartas boca abajo)
   * Muestra indicador de reciclaje cuando está vacío
   */
  actualizarMontStock() {
      const montStock = document.querySelector('[data-pila="mazo"]');
      montStock.innerHTML = '';
      
      if (this.stock.length > 0) {
          // Mostrar carta boca abajo
          const elementoCarta = document.createElement('div');
          elementoCarta.className = 'carta boca-abajo';
          elementoCarta.style.top = '0px';
          elementoCarta.style.left = '0px';
          elementoCarta.style.backgroundImage = `url('cartas/card_back.png')`;
          elementoCarta.onclick = () => this.repartirCartas();
          montStock.appendChild(elementoCarta);
      } else {
          // Mostrar indicador de reciclaje
          const elementoReciclar = document.createElement('div');
          elementoReciclar.className = 'carta indicador-reciclar';
          elementoReciclar.style.top = '0px';
          elementoReciclar.style.left = '0px';
          elementoReciclar.innerHTML = '↻'; 
          elementoReciclar.onclick = () => this.repartirCartas(); 
          montStock.appendChild(elementoReciclar);
      }
  }

  /**
   * Actualiza la visualización del mont de descarte
   * Muestra solo la carta superior si hay cartas
   */
  actualizarMontDescarte() {
      const montDescarte = document.querySelector('[data-pila="descarte"]');
      montDescarte.innerHTML = '';
      if (this.descarte.length > 0) {
          const carta = this.descarte[this.descarte.length - 1];
          const elementoCarta = this.crearElementoCarta(carta);
          elementoCarta.style.top = '0px';
          elementoCarta.style.left = '0px';
          montDescarte.appendChild(elementoCarta);
      }
  }

  /**
   * Actualiza la visualización de las 4 bases/fundaciones
   * Muestra símbolo del palo cuando está vacía, cartas cuando tiene contenido
   */
  actualizarBases() {
      this.bases.forEach((base, indice) => {
          const elementoBase = document.querySelector(`[data-fundacion="${indice}"]`);
          
          // Mostrar símbolo del palo si está vacía
          elementoBase.innerHTML = this.bases[indice].length === 0 ? 
              elementoBase.dataset.palo === 'corazones' ? '♥️' :
              elementoBase.dataset.palo === 'diamantes' ? '♦️' :
              elementoBase.dataset.palo === 'treboles' ? '♣️' : '♠️' : '';

          // Agregar todas las cartas de la base
          base.forEach((carta, indiceCarta) => {
              const elementoCarta = this.crearElementoCarta(carta);
              elementoCarta.style.top = '0px';
              elementoCarta.style.left = '0px';
              elementoCarta.style.zIndex = indiceCarta;
              elementoBase.appendChild(elementoCarta);
          });
      });
  }

  /**
   * Actualiza la visualización del tablero principal (7 columnas)
   * Posiciona las cartas con desplazamiento vertical para mostrar todas
   */
  actualizarTablero() {
      this.tablero.forEach((columna, indiceColumna) => {
          const elementoColumna = document.querySelector(`[data-columna="${indiceColumna}"]`);
          elementoColumna.innerHTML = '';

          columna.forEach((carta, indiceCarta) => {
              const elementoCarta = this.crearElementoCarta(carta);
              // Desplazamiento vertical para mostrar todas las cartas
              elementoCarta.style.top = `${indiceCarta * 25}px`;
              elementoCarta.style.left = '0px';
              elementoCarta.style.zIndex = indiceCarta;
              elementoColumna.appendChild(elementoCarta);
          });
      });
  }

  /**
   * Crea un elemento DOM para una carta específica
   * Configura imagen, clases CSS, arrastrable y otros atributos
   */
  crearElementoCarta(carta) {
      const elementoCarta = document.createElement('div');
      elementoCarta.className = `carta ${carta.caraArriba ? 'boca-arriba' : 'boca-abajo'} ${carta.color}`;
      elementoCarta.dataset.cardId = carta.id; 
      elementoCarta.draggable = carta.caraArriba; // Solo cartas boca arriba son arrastrables

      if (carta.caraArriba) {
          // Carta boca arriba: mostrar imagen específica
          const rutaImagen = `cartas/${carta.valor}${this.mapaSimbolos[carta.palo]}.png`;
          elementoCarta.style.backgroundImage = `url('${rutaImagen}')`;
      } else {
          // Carta boca abajo: mostrar reverso genérico
          elementoCarta.style.backgroundImage = `url('cartas/card_back.png')`;
      }

      return elementoCarta;
  }

  /**
   * Actualiza el resaltado visual de las cartas seleccionadas
   * Agrega/remueve clase CSS 'seleccionada' según corresponda
   */
  actualizarVisualizacionCartas() {
      document.querySelectorAll('.carta').forEach(elementoCarta => {
          const carta = this.obtenerCartaDeElemento(elementoCarta);
          if (carta && this.cartasSeleccionadas.includes(carta)) {
              elementoCarta.classList.add('seleccionada');
          } else {
              elementoCarta.classList.remove('seleccionada');
          }
      });
  }

  /**
   * Actualiza el marcador (contador de movimientos y cronómetro)
   * Formatea el tiempo transcurrido en formato MM:SS
   */
  actualizarMarcador() {
      document.getElementById('movimientos').textContent = this.movimientos;
      
      const tiempoTranscurrido = Math.floor((Date.now() - this.tiempoInicio) / 1000);
      const minutos = Math.floor(tiempoTranscurrido / 60);
      const segundos = tiempoTranscurrido % 60;
      document.getElementById('cronometro').textContent = 
          `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  }

  /**
   * Inicia el temporizador del juego
   * Se ejecuta cada segundo para actualizar el cronómetro
   */
  iniciarTemporizador() {
      if (this.intervalId) {
          clearInterval(this.intervalId);
      }
      
      this.intervalId = setInterval(() => {
          if (!this.juegoGanado) {
              this.actualizarMarcador();
          }
      }, 1000);
  }

  /**
   * Verifica si el juego ha sido ganado
   * Condición de victoria: todas las bases tienen 13 cartas (A-K completos)
   */
  verificarCondicionVictoria() {
      const todasLasBasesLlenas = this.bases.every(base => base.length === 13);
      
      if (todasLasBasesLlenas) {
          this.juegoGanado = true;
          this.mostrarMensajeVictoria();
      }
  }

  /**
   * Muestra el mensaje de victoria con estadísticas finales
   * Incluye movimientos realizados y tiempo total transcurrido
   */
  mostrarMensajeVictoria() {
      document.getElementById('movimientosFinal').textContent = this.movimientos;
      const tiempoTranscurrido = Math.floor((Date.now() - this.tiempoInicio) / 1000);
      const minutos = Math.floor(tiempoTranscurrido / 60);
      const segundos = tiempoTranscurrido % 60;
      document.getElementById('tiempoFinal').textContent = 
          `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
      document.getElementById('mensajeVictoria').style.display = 'block';
  }

  /**
   * Maneja el inicio del arrastre (drag)
   * Selecciona las cartas y configura los datos de transferencia
   */
  manejarInicioDrag(e) {
      const carta = e.target.closest('.carta');
      if (!carta) return;

      const datosCarta = this.obtenerCartaDeElemento(carta);
      if (!datosCarta || !datosCarta.caraArriba) {
          // No permitir arrastrar cartas boca abajo
          e.preventDefault();
          return;
      }

      this.seleccionarCartas(datosCarta);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', carta.outerHTML);
  }

  /**
   * Maneja el arrastre sobre un elemento (dragover)
   * Permite el drop y resalta visualmente las zonas válidas
   */
  manejarSobreDrag(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      const destinoDrop = this.obtenerDestinoSoltar(e.target);
      if (destinoDrop) {
          const elementoDestino = e.target.closest('.fundacion, .columna-tablero');
          if (elementoDestino) {
              elementoDestino.classList.add('zona-soltar', 'resaltada');
          }
      }
  }

  /**
   * Maneja el evento de soltar (drop)
   * Ejecuta el movimiento si es válido y limpia el estado visual
   */
  manejarSoltar(e) {
      e.preventDefault();
      
      const destino = this.obtenerDestinoSoltar(e.target);
      if (destino && this.cartasSeleccionadas.length > 0) {
          if (this.puedesMoverCartas(this.cartasSeleccionadas, destino)) {
              this.moverCartas(this.cartasSeleccionadas, destino);
          }
      }
      
      this.limpiarSeleccion();
      // Remover todos los resaltados visuales
      document.querySelectorAll('.resaltada').forEach(el => {
          el.classList.remove('resaltada');
      });
  }

  /**
   * Maneja el final del arrastre (dragend)
   * Limpia los efectos visuales del drag & drop
   */
  manejarFinDrag(e) {
      document.querySelectorAll('.resaltada').forEach(el => {
          el.classList.remove('resaltada');
      });
  }

  /**
   * Ejecuta movimientos automáticos cuando es posible
   * Busca cartas que pueden moverse automáticamente a las bases
   * Útil para acelerar el final del juego
   */
  ejecutarAutoJuego() {
      if (!this.autoJugar || this.juegoGanado) return;

      let movido = false;

      // Intentar mover cartas del tablero a las bases
      for (let columna of this.tablero) {
          if (columna.length > 0) {
              const cartaSuperior = columna[columna.length - 1];
              if (cartaSuperior.caraArriba) {
                  for (let i = 0; i < 4; i++) {
                      if (this.puedeMoverABase(cartaSuperior, this.bases[i])) {
                          this.moverCartas([cartaSuperior], { tipo: 'base', indice: i });
                          movido = true;
                          break;
                      }
                  }
              }
          }
      }

      // Si no se movió nada del tablero, intentar con el descarte
      if (!movido && this.descarte.length > 0) {
          const cartaSuperior = this.descarte[this.descarte.length - 1];
          for (let i = 0; i < 4; i++) {
              if (this.puedeMoverABase(cartaSuperior, this.bases[i])) {
                  this.moverCartas([cartaSuperior], { tipo: 'base', indice: i });
                  movido = true;
                  break;
              }
          }
      }

      // Si se hizo un movimiento, continuar buscando más movimientos
      if (movido) {
          setTimeout(() => this.ejecutarAutoJuego(), 500);
      } else {
          // No hay más movimientos automáticos posibles
          this.autoJugar = false;
      }
  }

  /**
   * Destruye la instancia del juego
   * Limpia timers y event listeners para evitar memory leaks
   */
  destruir() {
      if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
      }
      this.removerEventListeners();
  }
}

// Variable global para mantener la instancia actual del juego
let juego;

/**
 * Función para iniciar un nuevo juego
 * Oculta mensaje de victoria y crea nueva instancia
 */
function nuevoJuego() {
  document.getElementById('mensajeVictoria').style.display = 'none';
  if (juego) {
      // Destruir juego anterior para limpiar recursos
      juego.destruir();
  }
  juego = new JuegoSolitario();
}

/**
 * Inicialización cuando el DOM está completamente cargado
 * Punto de entrada principal de la aplicación
 */
document.addEventListener('DOMContentLoaded', () => {
  nuevoJuego();
});