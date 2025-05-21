import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/appbar.dart';
import 'package:metalwailers/widgets/footer.dart';
import 'package:metalwailers/widgets/servicios.dart';

class ServiciosScreen extends StatelessWidget {
  const ServiciosScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isWide = size.width > 800;

    final ScrollController scrollController = ScrollController(); // 👈

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      body: SingleChildScrollView(
        controller: scrollController, // 👈
        child: Column(
          children: [
            const CustomAppbar(),
            Padding(
              padding: EdgeInsets.symmetric(
                vertical: size.height * 0.1,
                horizontal: isWide ? size.width * 0.15 : size.width * 0.07,
              ),
              child: Servicios(scrollController: scrollController), // 👈
            ),
            Footer(),
          ],
        ),
      ),
    );
  }
}
