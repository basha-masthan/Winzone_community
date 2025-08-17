import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:winzone_arena/services/auth_service.dart';
import 'package:winzone_arena/services/api_service.dart';
import 'package:winzone_arena/services/payment_service.dart';
import 'package:winzone_arena/screens/splash_screen.dart';
import 'package:winzone_arena/utils/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize API service
  await ApiService().initialize();
  
  runApp(const WinzoneArenaApp());
}

class WinzoneArenaApp extends StatelessWidget {
  const WinzoneArenaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => PaymentService()),
      ],
      child: MaterialApp(
        title: 'Winzone Arena',
        theme: AppTheme.darkTheme,
        home: const SplashScreen(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
