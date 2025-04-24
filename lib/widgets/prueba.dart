import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class TestMailButton extends StatelessWidget {
  const TestMailButton({super.key});

  Future<void> _sendTestEmail() async {
    const functionUrl = 'https://assistify-token-generator-1014.twil.io/send-email'; // ⬅️ Reemplazá esto

    final response = await http.post(
      Uri.parse(functionUrl),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'to': 'manunv97@gmail.com',
        'subject': '📩 123',
        'text': '123 🛠️',
      }),
    );

    if (response.statusCode == 200) {
      print('✅ Correo enviado correctamente');
    } else {
      print('❌ Error al enviar correo: ${response.body}');
    }
  }

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      onPressed: _sendTestEmail,
      child: const Icon(Icons.send),
      tooltip: 'Enviar mail de prueba',
    );
  }
}
