import 'package:flutter/material.dart';

class AnimatedImageItem extends StatefulWidget {
  final String assetPath;
  final ScrollController scrollController;

  const AnimatedImageItem({
    super.key,
    required this.assetPath,
    required this.scrollController,
  });

  @override
  State<AnimatedImageItem> createState() => _AnimatedImageItemState();
}

class _AnimatedImageItemState extends State<AnimatedImageItem>
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
      _onScroll(); // check initial
    });
  }

  void _onScroll() {
    if (!_isVisible && _itemKey.currentContext != null) {
      final RenderBox renderBox =
          _itemKey.currentContext!.findRenderObject() as RenderBox;
      final position = renderBox.localToGlobal(Offset.zero).dy;
      final screenHeight = MediaQuery.of(context).size.height;

      if (position < screenHeight * 0.4) {
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
      child: Container(
        key: _itemKey,
        padding: const EdgeInsets.symmetric(vertical: 100),
        alignment: Alignment.center,
        child: Image.asset(widget.assetPath, height: 200, fit: BoxFit.contain),
      ),
    );
  }
}
