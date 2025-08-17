import 'package:flutter/material.dart';
import 'package:winzone_arena/screens/tournaments/tournaments_screen.dart';
import 'package:winzone_arena/screens/my_matches/my_matches_screen.dart';
import 'package:winzone_arena/screens/community/community_feed_screen.dart';
import 'package:winzone_arena/screens/wallet/wallet_screen.dart';
import 'package:winzone_arena/screens/profile/profile_screen.dart';
import 'package:winzone_arena/utils/theme.dart';

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 2; // Start with community feed (center tab)
  
  final List<Widget> _screens = [
    const TournamentsScreen(),
    const MyMatchesScreen(),
    const CommunityFeedScreen(),
    const WalletScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppTheme.surfaceColor,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                // Tab 1: Tournaments
                Expanded(
                  child: _buildTabItem(
                    index: 0,
                    icon: Icons.emoji_events_outlined,
                    activeIcon: Icons.emoji_events,
                  ),
                ),
                
                // Tab 2: My Matches
                Expanded(
                  child: _buildTabItem(
                    index: 1,
                    icon: Icons.sports_esports_outlined,
                    activeIcon: Icons.sports_esports,
                  ),
                ),
                
                // Tab 3: Community Feed (Center Large Button)
                Expanded(
                  flex: 2,
                  child: _buildCenterTab(),
                ),
                
                // Tab 4: Wallet
                Expanded(
                  child: _buildTabItem(
                    index: 3,
                    icon: Icons.account_balance_wallet_outlined,
                    activeIcon: Icons.account_balance_wallet,
                  ),
                ),
                
                // Tab 5: Profile
                Expanded(
                  child: _buildTabItem(
                    index: 4,
                    icon: Icons.person_outline,
                    activeIcon: Icons.person,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabItem({
    required int index,
    required IconData icon,
    required IconData activeIcon,
  }) {
    final isActive = _currentIndex == index;
    
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isActive ? AppTheme.primaryColor.withOpacity(0.15) : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                isActive ? activeIcon : icon,
                color: isActive ? AppTheme.primaryColor : AppTheme.textSecondary,
                size: 26,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCenterTab() {
    final isActive = _currentIndex == 2;
    
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = 2),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                gradient: isActive
                    ? const LinearGradient(
                        colors: [
                          AppTheme.primaryColor,
                          AppTheme.accentColor,
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: isActive ? null : AppTheme.cardColor,
                borderRadius: BorderRadius.circular(32),
                boxShadow: isActive
                    ? [
                        BoxShadow(
                          color: AppTheme.primaryColor.withOpacity(0.4),
                          blurRadius: 20,
                          spreadRadius: 2,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 2),
                        ),
                      ],
              ),
              child: Icon(
                Icons.forum,
                color: isActive ? Colors.white : AppTheme.textSecondary,
                size: 30,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
