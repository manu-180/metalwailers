import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class TestMailButton extends StatelessWidget {
  const TestMailButton({super.key});

  Future<void> _sendTestEmail() async {
    const functionUrl =
        'https://assistify-token-generator-1014.twil.io/send-email'; // ⬅️ Reemplazá esto

    await http.post(
      Uri.parse(functionUrl),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'to': 'manunv97@gmail.com',
        'subject': '📩 123',
        'text': '123 🛠️',
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      onPressed: _sendTestEmail,
      tooltip: 'Enviar mail de prueba',
      child: const Icon(Icons.send),
    );
  }
}
