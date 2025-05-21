import 'package:flutter/material.dart';

class HeaderMetalWailers extends StatefulWidget {
  final VoidCallback? onAnimacionTerminada;

  const HeaderMetalWailers({super.key, this.onAnimacionTerminada});

  @override
  State<HeaderMetalWailers> createState() => _HeaderMetalWailersState();
}

class _HeaderMetalWailersState extends State<HeaderMetalWailers> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _offsetAnimation;
  late Animation<double> _fadeAnimation;
  late Animation<double> _fadeLinea1;
  late Animation<Offset> _offsetLinea1;
  late Animation<double> _fadeLinea2;
  late Animation<Offset> _offsetLinea2;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );

    _offsetAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.4, curve: Curves.easeOut)));

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.4, curve: Curves.easeOut)),
    );

    _fadeLinea1 = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.45, 0.65, curve: Curves.easeOut)),
    );
    _offsetLinea1 = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.45, 0.65, curve: Curves.easeOut)),
    );

    _fadeLinea2 = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.60, 0.80, curve: Curves.easeOut)),
    );
    _offsetLinea2 = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.60, 0.80, curve: Curves.easeOut)),
    );

    _controller.forward().whenComplete(() {
      if (widget.onAnimacionTerminada != null) {
        widget.onAnimacionTerminada!();
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        FadeTransition(
          opacity: _fadeAnimation,
          child: SlideTransition(
            position: _offsetAnimation,
            child: Padding(
              padding: const EdgeInsets.only(top: 50),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(
                    'assets/logo/header_logo.png',
                    height: size.width > 600 ? size.width * 0.17 : 40,
                    frameBuilder: (context, child, frame, _) {
                      return child;
                    },
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'MetalWailers',
                    style: TextStyle(
                      fontSize: size.width > 600 ? size.width * 0.07 : 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 50),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FadeTransition(
              opacity: _fadeLinea1,
              child: SlideTransition(
                position: _offsetLinea1,
                child: Text(
                  'Soluciones metalúrgicas integrales a medida',
                  style: TextStyle(
                    fontSize: size.width > 600 ? size.width * 0.02 : 14,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
            const SizedBox(height: 10),
            FadeTransition(
              opacity: _fadeLinea2,
              child: SlideTransition(
                position: _offsetLinea2,
                child: Text(
                  'Diseño, desarrollo y producción con excelencia técnica',
                  style: TextStyle(
                    fontSize: size.width > 600 ? size.width * 0.02 : 14,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ],
        )
      ],
    );
  }
}
