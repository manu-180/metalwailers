import 'package:flutter/material.dart';

class IntroServiciosAnimado extends StatefulWidget {
  final VoidCallback onAnimacionTerminada;

  const IntroServiciosAnimado({super.key, required this.onAnimacionTerminada});

  @override
  State<IntroServiciosAnimado> createState() => _IntroServiciosAnimadoState();
}

class _IntroServiciosAnimadoState extends State<IntroServiciosAnimado> with TickerProviderStateMixin {
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

    _fade1 = CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.3, curve: Curves.easeOut));
    _slide1 = Tween<Offset>(begin: const Offset(0, 0.2), end: Offset.zero)
        .animate(CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.3, curve: Curves.easeOut)));

    _fade2 = CurvedAnimation(parent: _controller, curve: const Interval(0.3, 0.6, curve: Curves.easeOut));
    _slide2 = Tween<Offset>(begin: const Offset(0, 0.2), end: Offset.zero)
        .animate(CurvedAnimation(parent: _controller, curve: const Interval(0.3, 0.6, curve: Curves.easeOut)));

    _fade3 = CurvedAnimation(parent: _controller, curve: const Interval(0.6, 1.0, curve: Curves.easeOut));
    _slide3 = Tween<Offset>(begin: const Offset(0, 0.2), end: Offset.zero)
        .animate(CurvedAnimation(parent: _controller, curve: const Interval(0.6, 1.0, curve: Curves.easeOut)));

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
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
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
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Colors.white),
                ),
                SizedBox(height: 8),
                Text(
                  "Acompañamos a nuestros clientes desde la etapa inicial del proyecto, ofreciendo asesoramiento técnico en diseño y desarrollo de piezas y estructuras metálicas.",
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
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Colors.white),
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
