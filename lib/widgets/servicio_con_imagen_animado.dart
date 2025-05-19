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
  bool _hovering = false;
  bool _animStarted = false;

  late AnimationController _cardController;
  late AnimationController _imgController;

  late Animation<double> _fadeCard;
  late Animation<double> _fadeImg;
  late Animation<Offset> _slideCard;
  late Animation<Offset> _slideImg;

  @override
  void initState() {
    super.initState();

    _cardController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );

    _imgController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );

    _fadeCard = Tween<double>(begin: 0, end: 1).animate(_cardController);
    _fadeImg = Tween<double>(begin: 0, end: 1).animate(_imgController);

    _slideCard = Tween<Offset>(begin: const Offset(0, 0.2), end: Offset.zero)
        .animate(CurvedAnimation(parent: _cardController, curve: Curves.easeOut));

    _slideImg = Tween<Offset>(begin: const Offset(0, 0.2), end: Offset.zero)
        .animate(CurvedAnimation(parent: _imgController, curve: Curves.easeOut));

    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.scrollController.addListener(_onScroll);
      _onScroll();
    });
  }

  void _onScroll() {
    if (!_animStarted && _itemKey.currentContext != null) {
      final box = _itemKey.currentContext!.findRenderObject() as RenderBox;
      final position = box.localToGlobal(Offset.zero).dy;
      final screenHeight = MediaQuery.of(context).size.height;

      if (position < screenHeight * 0.75) {
        _animStarted = true;
        _cardController.forward().whenComplete(() => _imgController.forward());
      }
    }
  }

  @override
  void dispose() {
    widget.scrollController.removeListener(_onScroll);
    _cardController.dispose();
    _imgController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 800;

    return Padding(
      key: _itemKey,
      padding: const EdgeInsets.symmetric(vertical: 60),
      child: MouseRegion(
        onEnter: (_) => setState(() => _hovering = true),
        onExit: (_) => setState(() => _hovering = false),
        child: isWide
            ? Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // 📝 Card texto
                  Expanded(
                    child: SlideTransition(
                      position: _slideCard,
                      child: FadeTransition(
                        opacity: _fadeCard,
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: _hovering
                                ? [
                                    BoxShadow(
                                      color: Colors.black26,
                                      blurRadius: 10,
                                      offset: const Offset(0, 6),
                                    )
                                  ]
                                : [],
                          ),
                          padding: const EdgeInsets.all(24),
                          margin: const EdgeInsets.only(right: 40),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.titulo,
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: _hovering ? Colors.black : Colors.grey.shade800,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                widget.descripcion,
                                style: TextStyle(
                                  fontSize: 16,
                                  height: 1.6,
                                  color: _hovering ? Colors.black : Colors.grey.shade800,
                                ),
                                textAlign: TextAlign.justify,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),

                  // 🖼 Imagen
                  SlideTransition(
                    position: _slideImg,
                    child: FadeTransition(
                      opacity: _fadeImg,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.asset(
                          widget.imagenAsset,
                          width: 420,
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
                    position: _slideCard,
                    child: FadeTransition(
                      opacity: _fadeCard,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: _hovering
                              ? [
                                  BoxShadow(
                                    color: Colors.black26,
                                    blurRadius: 10,
                                    offset: const Offset(0, 6),
                                  )
                                ]
                              : [],
                        ),
                        padding: const EdgeInsets.all(20),
                        margin: const EdgeInsets.only(bottom: 20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.titulo,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              widget.descripcion,
                              style: const TextStyle(fontSize: 15, height: 1.6),
                              textAlign: TextAlign.justify,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  SlideTransition(
                    position: _slideImg,
                    child: FadeTransition(
                      opacity: _fadeImg,
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
    );
  }
}
