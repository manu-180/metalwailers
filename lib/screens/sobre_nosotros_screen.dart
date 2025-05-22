import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/appbar.dart';
import 'package:metalwailers/widgets/footer.dart';
import 'package:metalwailers/widgets/sobre_nosotros.dart';

class SobreNosotrosScreen extends StatefulWidget {
  const SobreNosotrosScreen({super.key});

  @override
  State<SobreNosotrosScreen> createState() => _SobreNosotrosScreenState();
}

class _SobreNosotrosScreenState extends State<SobreNosotrosScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose(); // muy importante
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isWide = size.width > 800;

    return Scaffold(
      backgroundColor: Colors.black,
      body: SingleChildScrollView(
        controller: _scrollController, // ✅ lo conectás acá
        child: Column(
          children: [
            const CustomAppbar(),
            Padding(
              padding: EdgeInsets.symmetric(
                vertical: size.height * 0.04,
                horizontal: isWide ? size.width * 0.15 : size.width * 0.07,
              ),
              child: SobreNosotros(scrollController: _scrollController), // ✅ se lo pasás acá
            ),
            const Footer(),
          ],
        ),
      ),
    );
  }
}
