import {
  Backpack,
  Smartphone,
  ClipboardList,
  KeyRound,
  Wallet,
  Package,
  PawPrint,
  type LucideIcon,
} from 'lucide-react-native';

export const CATEGORIES: { name: string; icon: LucideIcon }[] = [
  { name: 'Bags', icon: Backpack },
  { name: 'Electronics', icon: Smartphone },
  { name: 'Documents', icon: ClipboardList },
  { name: 'Keys', icon: KeyRound },
  { name: 'Wallets', icon: Wallet },
  { name: 'Accessories', icon: Package },
  { name: 'Pets', icon: PawPrint },
  { name: 'Other', icon: Package },
];