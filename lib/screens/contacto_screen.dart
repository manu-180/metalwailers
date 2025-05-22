import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/appbar.dart';
import 'package:metalwailers/widgets/contactanos.dart';
import 'package:metalwailers/widgets/footer.dart';

class ContactoScreen extends StatelessWidget {
  const ContactoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final scrollController = ScrollController(); // 👈
    final size = MediaQuery.of(context).size;
    final isWide = size.width > 1000;

    return Scaffold(
      backgroundColor: Colors.black, // 👈 Fondo negro
      body: SingleChildScrollView(
        controller: scrollController, // 👈
        child: Column(
          children: [
            const CustomAppbar(),
            Padding(
              padding: EdgeInsets.symmetric(
                vertical: size.height * 0.04,
                horizontal: isWide ? size.width * 0.15 : size.width * 0.07,
              ),
              child: Contactanos(), // 👈 pasás el controller
            ),
            const Footer(),
          ],
        ),
      ),
    );
  }
}

