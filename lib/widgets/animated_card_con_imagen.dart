import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';

class AnimatedCardConImagen extends StatefulWidget {
  final String title;
  final String description;
  final String extraDescription;
  final String imagePath;
  final ScrollController scrollController;
  final String imageHoverPath;

  const AnimatedCardConImagen({
    super.key,
    required this.title,
    required this.description,
    required this.extraDescription,
    required this.imagePath,
    required this.scrollController,
    required this.imageHoverPath,
  });

  @override
  State<AnimatedCardConImagen> createState() => _AnimatedCardConImagenState();
}

class _AnimatedCardConImagenState extends State<AnimatedCardConImagen>
    with TickerProviderStateMixin {
  final GlobalKey _itemKey = GlobalKey();
  bool _isVisible = false;
  bool _hoverActivo = false;
  bool _expandida = false;
  bool _mostrarDescripcionExtra = false;

  late AnimationController _mainController;
  late AnimationController _imageController;

  late Animation<Offset> _cardOffset;
  late Animation<double> _cardOpacity;
  late Animation<Offset> _imageOffset;
  late Animation<double> _imageOpacity;

  @override
  void initState() {
    super.initState();

    _mainController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _imageController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _cardOffset = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _mainController, curve: Curves.easeOut));

    _cardOpacity = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(parent: _mainController, curve: Curves.easeOut));

    _imageOffset = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _imageController, curve: Curves.easeOut));

    _imageOpacity = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(parent: _imageController, curve: Curves.easeOut));

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
        _mainController.forward().then((_) => _imageController.forward());
        _isVisible = true;
      }
    }
  }

  void _toggleExpand() {
    setState(() {
      _expandida = !_expandida;
      _mostrarDescripcionExtra = false;
    });

    if (_expandida) {
      Future.delayed(const Duration(milliseconds: 200), () {
        if (mounted) setState(() => _mostrarDescripcionExtra = true);
      });
    }
  }

  @override
  void dispose() {
    widget.scrollController.removeListener(_onScroll);
    _mainController.dispose();
    _imageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isWide = size.width > 800;

    return Container(
      width: size.width * 0.7,
      key: _itemKey,
      margin: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
      child:
          isWide
              ? Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // CARD
                  Expanded(
                    child: AnimatedBuilder(
                      animation: _mainController,
                      builder:
                          (context, child) => Opacity(
                            opacity: _cardOpacity.value,
                            child: Transform.translate(
                              offset: _cardOffset.value * 100,
                              child: child,
                            ),
                          ),
                      child: _buildCardContent(),
                    ),
                  ),
                  const SizedBox(width: 100),
                  // IMAGEN
                  Expanded(
                    child: MouseRegion(
                      onEnter: (_) => setState(() => _hoverActivo = true),
                      onExit: (_) => setState(() => _hoverActivo = false),
                      cursor: SystemMouseCursors.click,
                      child: GestureDetector(
                        onTap: _toggleExpand,
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 400),
                          switchInCurve: Curves.easeInOut,
                          switchOutCurve: Curves.easeInOut,
                          transitionBuilder:
                              (child, animation) => FadeTransition(
                                opacity: animation,
                                child: child,
                              ),

                          child: ClipRRect(
                            key: ValueKey(_hoverActivo),
                            borderRadius: BorderRadius.circular(16),
                            child: Image.asset(
                              _hoverActivo
                                  ? widget.imageHoverPath
                                  : widget.imagePath,
                              height: 350,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              )
              : Column(
                children: [
                  AnimatedBuilder(
                    animation: _mainController,
                    builder:
                        (context, child) => Opacity(
                          opacity: _cardOpacity.value,
                          child: Transform.translate(
                            offset: _cardOffset.value * 100,
                            child: child,
                          ),
                        ),
                    child: _buildCardContent(),
                  ),
                  const SizedBox(height: 24),
                  FadeTransition(
                    opacity: _imageOpacity,
                    child: SlideTransition(
                      position: _imageOffset,
                      child: MouseRegion(
                        onEnter: (_) => setState(() => _hoverActivo = true),
                        onExit: (_) => setState(() => _hoverActivo = false),
                        cursor: SystemMouseCursors.click,
                        child: GestureDetector(
                          onTap: _toggleExpand,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.asset(
                              widget.imagePath,
                              fit: BoxFit.cover,
                            ),
                          ),
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
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 24),
        padding: const EdgeInsets.all(16),
        transform: _hoverActivo
            ? Matrix4.translationValues(0, -6, 0)
            : Matrix4.identity(),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: _hoverActivo
              ? Colors.grey.shade400
              : Colors.grey.shade200,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
         
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.title,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: _hoverActivo ? Colors.black : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.description,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.black,
                    ),
                  ),
                  AnimatedSize(
  duration: const Duration(milliseconds: 300),
  curve: Curves.easeOut,
  child: _expandida
      ? AnimatedOpacity(
          opacity: _mostrarDescripcionExtra ? 1.0 : 0.0,
          duration: const Duration(milliseconds: 300),
          child: Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(
              widget.extraDescription,
              style: const TextStyle(
                fontSize: 13,
                color: Colors.black,
              ),
            ),
          ),
        )
      : const SizedBox.shrink(),
),

                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
    }