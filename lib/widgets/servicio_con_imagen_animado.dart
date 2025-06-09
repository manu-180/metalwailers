import 'package:flutter/material.dart';

class ServicioConImagenAnimado extends StatefulWidget {
  final String titulo;
  final String descripcion;
  final String extraDescripcion;
  final String imagenAsset;
  final ScrollController scrollController;

  const ServicioConImagenAnimado({
    super.key,
    required this.titulo,
    required this.descripcion,
    required this.extraDescripcion,
    required this.imagenAsset,
    required this.scrollController,
  });

  @override
  State<ServicioConImagenAnimado> createState() =>
      _ServicioConImagenAnimadoState();
}

class _ServicioConImagenAnimadoState extends State<ServicioConImagenAnimado>
    with TickerProviderStateMixin {
  final GlobalKey _itemKey = GlobalKey();
  bool _isVisible = false;
  bool _hoverActivo = false;
  bool _expandida = false;
  bool _mostrarExtra = false;

  late AnimationController _textController;
  late AnimationController _imageController;
  late Animation<Offset> _offsetText;
  late Animation<double> _opacityText;
  late Animation<Offset> _offsetImage;
  late Animation<double> _opacityImage;

  @override
  void initState() {
    super.initState();

    _textController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _imageController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _offsetText = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _textController, curve: Curves.easeOut));
    _opacityText = Tween<double>(begin: 0, end: 1).animate(_textController);

    _offsetImage = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _imageController, curve: Curves.easeOut));
    _opacityImage = Tween<double>(begin: 0, end: 1).animate(_imageController);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.scrollController.addListener(_onScroll);
      _onScroll();
    });
  }

  void _onScroll() {
    if (!_isVisible && _itemKey.currentContext != null) {
      final position =
          (_itemKey.currentContext!.findRenderObject() as RenderBox)
              .localToGlobal(Offset.zero)
              .dy;
      final screenHeight = MediaQuery.of(context).size.height;
      if (position < screenHeight * 0.8) {
        _textController.forward().then((_) => _imageController.forward());
        _isVisible = true;
      }
    }
  }

  @override
  void dispose() {
    widget.scrollController.removeListener(_onScroll);
    _textController.dispose();
    _imageController.dispose();
    super.dispose();
  }

  void _toggleExpand() {
    setState(() {
      _expandida = !_expandida;
      _mostrarExtra = false;
    });

    if (_expandida) {
      Future.delayed(const Duration(milliseconds: 150), () {
        if (mounted) setState(() => _mostrarExtra = true);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 800;

    return Container(
      key: _itemKey,
      margin: const EdgeInsets.symmetric(vertical: 40),
      width: double.infinity,
      child:
          isWide
              ? Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Card a la izquierda
                  Expanded(child: _buildCardContent()),
                  const SizedBox(width: 60),
                  // Imagen a la derecha
                  Expanded(
                    child: FadeTransition(
                      opacity: _opacityImage,
                      child: SlideTransition(
                        position: _offsetImage,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.asset(
                            widget.imagenAsset,
                            height: 350,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              )
              : Column(
                children: [
                  _buildCardContent(),
                  const SizedBox(height: 24),
                  FadeTransition(
                    opacity: _opacityImage,
                    child: SlideTransition(
                      position: _offsetImage,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.asset(
                          widget.imagenAsset,
                          height: 300,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
    );
  }

  Widget _buildCardContent() {
    return GestureDetector(
      onTap: _toggleExpand,
      child: MouseRegion(
        onEnter: (_) => setState(() => _hoverActivo = true),
        onExit: (_) => setState(() => _hoverActivo = false),
        cursor: SystemMouseCursors.click,
        child: FadeTransition(
          opacity: _opacityText,
          child: SlideTransition(
            position: _offsetText,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeOut,
              transform:
                  _hoverActivo
                      ? Matrix4.translationValues(0, -8, 0)
                      : Matrix4.identity(),
              decoration: BoxDecoration(
                color:
                    _hoverActivo ? Colors.grey.shade800 : Colors.grey.shade900,
                borderRadius: BorderRadius.circular(12),
                boxShadow:
                    _hoverActivo
                        ? [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.4),
                            blurRadius: 12,
                            offset: const Offset(0, 8),
                          ),
                        ]
                        : [],
              ),
              padding: const EdgeInsets.all(24),
              constraints:
                  _expandida
                      ? const BoxConstraints(minHeight: 350)
                      : const BoxConstraints(minHeight: 0),
              child: AnimatedSize(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeOut,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: AnimatedDefaultTextStyle(
                            duration: const Duration(milliseconds: 200),
                            style: TextStyle(
                              color:
                                  _hoverActivo ? Colors.white : Colors.white60,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                            child: Text(widget.titulo),
                          ),
                        ),
                        GestureDetector(
                          onTap: _toggleExpand,
                          child: AnimatedRotation(
                            turns: _expandida ? 0.5 : 0.0,
                            duration: const Duration(milliseconds: 300),
                            child: Icon(
                              Icons.keyboard_arrow_down,
                              color: Colors.white70,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      widget.descripcion,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 18,
                      ),
                    ),
                    if (_expandida)
                      AnimatedOpacity(
                        opacity: _mostrarExtra ? 1.0 : 0.0,
                        duration: const Duration(milliseconds: 300),
                        child: Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: Text(
                            widget.extraDescripcion,
                            style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 18,
                              height: 1.4,
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
      ),
    );
  }
}
