import 'package:flutter/material.dart';

class ServicioConImagenAnimado extends StatefulWidget {
  final String titulo;
  final String descripcion;
  final String imagenAsset;
  final ScrollController scrollController;

  const ServicioConImagenAnimado({
    super.key,
    required this.titulo,
    required this.descripcion,
    required this.imagenAsset,
    required this.scrollController,
  });

  @override
  State<ServicioConImagenAnimado> createState() => _ServicioConImagenAnimadoState();
}

class _ServicioConImagenAnimadoState extends State<ServicioConImagenAnimado>
    with TickerProviderStateMixin {
  final GlobalKey _itemKey = GlobalKey();
  bool _animacionIniciada = false;

  late AnimationController _tituloController;
  late AnimationController _descripcionController;
  late AnimationController _imagenController;

  late Animation<double> _fadeTitulo;
  late Animation<double> _fadeDescripcion;
  late Animation<double> _fadeImagen;

  late Animation<Offset> _slideTitulo;
  late Animation<Offset> _slideDescripcion;
  late Animation<Offset> _slideImagen;

  @override
  void initState() {
    super.initState();

    _tituloController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _descripcionController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _imagenController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    _fadeTitulo = Tween<double>(begin: 0, end: 1).animate(_tituloController);
    _fadeDescripcion = Tween<double>(begin: 0, end: 1).animate(_descripcionController);
    _fadeImagen = Tween<double>(begin: 0, end: 1).animate(_imagenController);

    _slideTitulo = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _tituloController, curve: Curves.easeOut));

    _slideDescripcion = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _descripcionController, curve: Curves.easeOut));

    _slideImagen = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _imagenController, curve: Curves.easeOut));

    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.scrollController.addListener(_onScroll);
      _onScroll();
    });
  }

  void _onScroll() {
    if (!_animacionIniciada && _itemKey.currentContext != null) {
      final renderBox = _itemKey.currentContext!.findRenderObject() as RenderBox;
      final position = renderBox.localToGlobal(Offset.zero).dy;
      final screenHeight = MediaQuery.of(context).size.height;

      if (position < screenHeight * 0.7) {
        _animacionIniciada = true;
        _tituloController.forward().whenComplete(() {
          _descripcionController.forward().whenComplete(() {
            _imagenController.forward();
          });
        });
      }
    }
  }

  @override
  void dispose() {
    widget.scrollController.removeListener(_onScroll);
    _tituloController.dispose();
    _descripcionController.dispose();
    _imagenController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isWide = size.width > 800;

    return Padding(
      key: _itemKey,
      padding: const EdgeInsets.symmetric(vertical: 60),
      child: Align(
        alignment: Alignment.center,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: size.width * 0.7),
          child: isWide
              ? Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 📝 Texto
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SlideTransition(
                            position: _slideTitulo,
                            child: FadeTransition(
                              opacity: _fadeTitulo,
                              child: Text(
                                widget.titulo,
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          SlideTransition(
                            position: _slideDescripcion,
                            child: FadeTransition(
                              opacity: _fadeDescripcion,
                              child: Text(
                                widget.descripcion,
                                style: const TextStyle(
                                  fontSize: 16,
                                  height: 1.6,
                                ),
                                textAlign: TextAlign.justify,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 40),
                    // 🖼 Imagen
                    SlideTransition(
                      position: _slideImagen,
                      child: FadeTransition(
                        opacity: _fadeImagen,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.asset(
                            widget.imagenAsset,
                            width: 380,
                            height: 260,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ),
                  ],
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SlideTransition(
                      position: _slideTitulo,
                      child: FadeTransition(
                        opacity: _fadeTitulo,
                        child: Text(
                          widget.titulo,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    SlideTransition(
                      position: _slideDescripcion,
                      child: FadeTransition(
                        opacity: _fadeDescripcion,
                        child: Text(
                          widget.descripcion,
                          style: const TextStyle(fontSize: 15),
                          textAlign: TextAlign.justify,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    SlideTransition(
                      position: _slideImagen,
                      child: FadeTransition(
                        opacity: _fadeImagen,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.asset(
                            widget.imagenAsset,
                            height: 220,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
