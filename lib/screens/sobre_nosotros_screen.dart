import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/appbar.dart';
import 'package:metalwailers/widgets/footer.dart';
import 'package:metalwailers/widgets/frase_final.dart';
import 'package:metalwailers/widgets/sobre_nosotros.dart';
import 'package:metalwailers/widgets/wpp_floating_button.dart';

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
      backgroundColor: Colors.white,
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
              child: SobreNosotros(
                scrollController: _scrollController,
              ), // ✅ se lo pasás acá
            ),
            FraseFinal(
              scrollController: _scrollController,
              texto:
                  'En cada proyecto, fusionamos tradición metalúrgica y visión de futuro. MetalWailers es sinónimo de precisión, innovación y compromiso con tu crecimiento.',
            ),
            SizedBox(height: 100), // Espacio entre FraseFinal y Footer
            const Footer(),
          ],
        ),
      ),
      floatingActionButton: WhatsappFloatingButton(),
    );
  }
}
