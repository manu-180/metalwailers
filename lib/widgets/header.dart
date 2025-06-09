import 'package:flutter/material.dart';

class HeaderMetalWailers extends StatefulWidget {
  final VoidCallback? onAnimacionTerminada;

  const HeaderMetalWailers({super.key, this.onAnimacionTerminada});

  @override
  State<HeaderMetalWailers> createState() => _HeaderMetalWailersState();
}

class _HeaderMetalWailersState extends State<HeaderMetalWailers>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _offsetAnimation;
  late Animation<double> _fadeAnimation;
  late Animation<double> _fadeLinea1;
  late Animation<Offset> _offsetLinea1;
  late Animation<double> _fadeLinea2;
  late Animation<Offset> _offsetLinea2;

  bool _imagenCargada = false;
  bool _animacionIniciada = false;

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
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.4, curve: Curves.easeOut),
      ),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.4, curve: Curves.easeOut),
      ),
    );

    _fadeLinea1 = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.45, 0.65, curve: Curves.easeOut),
      ),
    );
    _offsetLinea1 = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.45, 0.65, curve: Curves.easeOut),
      ),
    );

    _fadeLinea2 = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.60, 0.80, curve: Curves.easeOut),
      ),
    );
    _offsetLinea2 = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.60, 0.80, curve: Curves.easeOut),
      ),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    // Precarga segura
    precacheImage(
      const AssetImage('assets/logo/logoweb.png'),
      context,
    ).then((_) {
      if (mounted) {
        setState(() => _imagenCargada = true);
        _iniciarAnimacion();
      }
    });
  }

  void _iniciarAnimacion() {
    if (!_animacionIniciada && mounted) {
      _controller.forward().whenComplete(() {
        widget.onAnimacionTerminada?.call();
      });
      _animacionIniciada = true;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isWide = size.width > 600;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(height: 20),
        AnimatedOpacity(
          opacity: _imagenCargada ? 1.0 : 0.0,
          duration: const Duration(milliseconds: 400),
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _offsetAnimation,
              child: Padding(
                padding: const EdgeInsets.only(top: 50),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    isWide ?
                    Image.asset(
                      'assets/logo/logowebbbbb.png',
                      height: isWide ? size.width * 0.17 : size.width * 0.26,
                      frameBuilder: (context, child, frame, _) => child,
                    )
                    : SizedBox.shrink(),
                   SizedBox(width:isWide ?  12 : 0),
                    SlideTransition(
                      position: _offsetAnimation,
                      child: AnimatedOpacity(
                        opacity: _imagenCargada ? 1.0 : 0.0,
                        duration: const Duration(milliseconds: 400),
                        child: Text(
                          'METALWAILERS',
                          style: TextStyle(
                            fontSize: isWide ? size.width * 0.07 : size.width * 0.12,
                            fontWeight: FontWeight.bold,
                            color: Colors.black,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
         SizedBox(height: isWide ? 100: 50),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FadeTransition(
                opacity: _fadeLinea1,
                child: SlideTransition(
                  position: _offsetLinea1,
                  child: Text(
                    'Soluciones metalúrgicas integrales a medida.',
                    style: TextStyle(
                      fontSize: isWide ? size.width * 0.02 : size.width * 0.06,
                      color: Colors.black,
                      fontWeight: FontWeight.w500
                    ),
                    textAlign: TextAlign.start,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              FadeTransition(
                opacity: _fadeLinea2,
                child: SlideTransition(
                  position: _offsetLinea2,
                  child: Text(
                    'Diseño, desarrollo y producción con excelencia técnica.',
                    style: TextStyle(
                      fontSize: isWide ? size.width * 0.02 : size.width * 0.06,
                      color: Colors.black,
                      fontWeight: FontWeight.w500
                    ),
                    textAlign: TextAlign.start,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
