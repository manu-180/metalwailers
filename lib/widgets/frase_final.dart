import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:metalwailers/widgets/animated_button.dart';

class FraseFinal extends StatefulWidget {
  final ScrollController scrollController;
  final String texto;

  const FraseFinal({
    super.key,
    required this.scrollController,
    required this.texto,
  });

  @override
  State<FraseFinal> createState() => _FraseFinalState();
}

class _FraseFinalState extends State<FraseFinal>
    with SingleTickerProviderStateMixin {
  final GlobalKey _itemKey = GlobalKey();
  bool _isVisible = false;

  late AnimationController _controller;
  late Animation<Offset> _offsetAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _offsetAnimation = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));

    _opacityAnimation = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));

    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.scrollController.addListener(_onScroll);
      _onScroll(); // Por si ya está visible al cargar
    });
  }

  void _onScroll() {
    if (!_isVisible && _itemKey.currentContext != null) {
      final position =
          (_itemKey.currentContext!.findRenderObject() as RenderBox)
              .localToGlobal(Offset.zero)
              .dy;
      final screenHeight = MediaQuery.of(context).size.height;

      if (position < screenHeight * 0.6) {
        _controller.forward();
        _isVisible = true;
      }
    }
  }

  @override
  void dispose() {
    widget.scrollController.removeListener(_onScroll);
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isWide = size.width > 800;

    return AnimatedBuilder(
      animation: _controller,
      builder:
          (context, child) => Opacity(
            opacity: _opacityAnimation.value,
            child: Transform.translate(
              offset: _offsetAnimation.value * 100,
              child: child,
            ),
          ),
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: isWide ? size.width * 0.15 : size.width * 0.1,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              key: _itemKey,

              alignment: Alignment.center,
              child: Text(
                widget.texto,
                textAlign: TextAlign.start,
                style: const TextStyle(
                  color: Colors.black,
                  fontSize: 24,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            SizedBox(height: size.height * 0.05),
            HoverAnimatedButton(
              onPressed: () {
                context.go("/contacto");
              },
              text: "Contactanos",
            ),
          ],
        ),
      ),
    );
  }
}
