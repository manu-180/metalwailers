import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/servicio_con_imagen_animado.dart';

class Servicios extends StatefulWidget {
  final ScrollController scrollController;
  const Servicios({super.key, required this.scrollController});

  @override
  State<Servicios> createState() => _ServiciosState();
}

class _ServiciosState extends State<Servicios> with TickerProviderStateMixin {
  late final AnimationController _controller;
  late final List<Animation<Offset>> _slideAnimations;
  late final List<Animation<double>> _fadeAnimations;

  late final AnimationController _listaController;
  late final Animation<Offset> _slideLista;
  late final Animation<double> _fadeLista;

  final List<Map<String, String>> servicios = [
    {
      'titulo': 'Corte CNC Láser',
      'descripcion':
          'Permite realizar cortes de alta precisión sobre chapas metálicas utilizando un haz láser concentrado. Ideal para detalles finos y acabados limpios.',
      'imagen': 'imagen1.png',
    },
    {
      'titulo': 'Corte CNC Plasma',
      'descripcion':
          'Utiliza gas ionizado para cortar metales conductores con rapidez y eficiencia, perfecto para cortes de mayor espesor.',
      'imagen': 'imagen2.png',
    },
    {
      'titulo': 'Guillotinado',
      'descripcion':
          'Consiste en cortar láminas metálicas con una cuchilla recta aplicando gran fuerza, obteniendo cortes rectos y precisos.',
      'imagen': 'imagen3.png',
    },
    {
      'titulo': 'Plegado',
      'descripcion':
          'Proceso para doblar chapas metálicas en ángulos determinados, utilizando prensas de precisión hidráulicas.',
      'imagen': 'imagen4.png',
    },
    {
      'titulo': 'Curvado',
      'descripcion':
          'Permite doblar tubos o perfiles de forma controlada para obtener curvas suaves sin dañar el material.',
      'imagen': 'imagen5.png',
    },
    {
      'titulo': 'Cilindrado',
      'descripcion':
          'Consiste en dar forma cilíndrica a una chapa plana pasando por una máquina roladora con rodillos.',
      'imagen': 'imagen6.png',
    },
    {
      'titulo': 'Rolado',
      'descripcion':
          'Técnica de formado para curvar chapas en diferentes radios mediante múltiples pasadas en rodillos.',
      'imagen': 'imagen7.png',
    },
    {
      'titulo': 'Punzonado',
      'descripcion':
          'Realiza perforaciones o formas en chapa con una prensa y punzón, ideal para producción en serie.',
      'imagen': 'imagen8.png',
    },
    {
      'titulo': 'Balancinado',
      'descripcion':
          'Utiliza balancines para operaciones repetitivas de corte o conformado con gran rapidez.',
      'imagen': 'imagen9.png',
    },
    {
      'titulo': 'Soldadura MIG, TIG y por punto',
      'descripcion':
          'Soldamos piezas con técnicas según la necesidad: MIG para rapidez, TIG para precisión, y por punto para estructuras livianas.',
      'imagen': 'imagen10.png',
    },
    {
      'titulo': 'Pintura a horno',
      'descripcion':
          'Aplicamos pintura electrostática horneada para acabados duraderos, resistentes y de excelente presentación.',
      'imagen': 'imagen11.png',
    },
  ];

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );

    _fadeAnimations = List.generate(
      5,
      (i) => CurvedAnimation(
        parent: _controller,
        curve: Interval(i * 0.12, i * 0.12 + 0.4, curve: Curves.easeOut),
      ),
    );

    _slideAnimations = List.generate(
      5,
      (i) => Tween<Offset>(
        begin: const Offset(0, 0.2),
        end: Offset.zero,
      ).animate(
        CurvedAnimation(
          parent: _controller,
          curve: Interval(i * 0.12, i * 0.12 + 0.4, curve: Curves.easeOut),
        ),
      ),
    );

    _listaController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    _fadeLista = CurvedAnimation(
      parent: _listaController,
      curve: Curves.easeOut,
    );

    _slideLista = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(_fadeLista);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _controller.forward().whenComplete(() {
        _listaController.forward();
      });
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _listaController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SlideTransition(
          position: _slideAnimations[0],
          child: FadeTransition(
            opacity: _fadeAnimations[0],
            child: const Text(
              "Servicios que Ofrecemos",
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
          ),
        ),
        const SizedBox(height: 24),
        SlideTransition(
          position: _slideAnimations[1],
          child: FadeTransition(
            opacity: _fadeAnimations[1],
            child: const Text(
              "Asesoramiento Integral",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
            ),
          ),
        ),
        const SizedBox(height: 8),
        SlideTransition(
          position: _slideAnimations[2],
          child: FadeTransition(
            opacity: _fadeAnimations[2],
            child: const Text(
              "Acompañamos a nuestros clientes desde la etapa inicial del proyecto, ofreciendo asesoramiento técnico en diseño y desarrollo de piezas y estructuras metálicas.",
              textAlign: TextAlign.justify,
            ),
          ),
        ),
        const SizedBox(height: 32),
        SlideTransition(
          position: _slideAnimations[3],
          child: FadeTransition(
            opacity: _fadeAnimations[3],
            child: const Text(
              "Producción Metalúrgica",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
            ),
          ),
        ),
        const SizedBox(height: 8),
        SlideTransition(
          position: _slideAnimations[4],
          child: FadeTransition(
            opacity: _fadeAnimations[4],
            child: const Text(
              "Contamos con una amplia gama de procesos productivos, realizados con equipamiento de última generación.",
              textAlign: TextAlign.justify,
            ),
          ),
        ),
        const SizedBox(height: 40),

        // 👇 Animación de las cards de servicios
        SlideTransition(
          position: _slideLista,
          child: FadeTransition(
            opacity: _fadeLista,
            child: Column(
              children: servicios
                  .map(
                    (servicio) => ServicioConImagenAnimado(
                      titulo: servicio['titulo']!,
                      descripcion: servicio['descripcion']!,
                      imagenAsset: 'assets/images/${servicio['imagen']}',
                      scrollController: widget.scrollController,
                    ),
                  )
                  .toList(),
            ),
          ),
        ),

        const SizedBox(height: 80),
      ],
    );
  }
}
