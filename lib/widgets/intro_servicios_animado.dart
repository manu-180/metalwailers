import 'package:flutter/material.dart';

class IntroServiciosAnimado extends StatefulWidget {
  final VoidCallback onAnimacionTerminada;

  const IntroServiciosAnimado({super.key, required this.onAnimacionTerminada});

  @override
  State<IntroServiciosAnimado> createState() => _IntroServiciosAnimadoState();
}

class _IntroServiciosAnimadoState extends State<IntroServiciosAnimado>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fade1;
  late Animation<Offset> _slide1;
  late Animation<double> _fade2;
  late Animation<Offset> _slide2;
  late Animation<double> _fade3;
  late Animation<Offset> _slide3;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      duration: const Duration(milliseconds: 1800),
      vsync: this,
    );

    _fade1 = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.0, 0.3, curve: Curves.easeOut),
    );
    _slide1 = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.3, curve: Curves.easeOut),
      ),
    );

    _fade2 = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.3, 0.6, curve: Curves.easeOut),
    );
    _slide2 = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.3, 0.6, curve: Curves.easeOut),
      ),
    );

    _fade3 = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.6, 1.0, curve: Curves.easeOut),
    );
    _slide3 = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.6, 1.0, curve: Curves.easeOut),
      ),
    );

    _controller.forward().whenComplete(() {
      widget.onAnimacionTerminada();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SlideTransition(
          position: _slide1,
          child: FadeTransition(
            opacity: _fade1,
            child: const Text(
              "Servicios que Ofrecemos",
              style: TextStyle(
                fontSize: 35,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        SlideTransition(
          position: _slide2,
          child: FadeTransition(
            opacity: _fade2,
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Asesoramiento Integral",
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  "Brindamos un acompañamiento integral desde la concepción misma del proyecto, asesorando a nuestros clientes en cada decisión técnica y funcional. Nuestro equipo evalúa requerimientos específicos, propone soluciones viables y colabora activamente en el diseño y desarrollo de piezas y estructuras metálicas. Este enfoque personalizado garantiza que cada propuesta se ajuste a las necesidades reales del cliente, optimizando tiempos, costos y calidad desde la etapa de planificación hasta la ejecución final.",
                  style: TextStyle(color: Colors.white70),
                  textAlign: TextAlign.justify,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 32),
        SlideTransition(
          position: _slide3,
          child: FadeTransition(
            opacity: _fade3,
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Producción Metalúrgica",
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  "Contamos con una amplia gama de procesos productivos, realizados con equipamiento de última generación.",
                  style: TextStyle(color: Colors.white70),
                  textAlign: TextAlign.justify,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 50),
      ],
    );
  }
}
