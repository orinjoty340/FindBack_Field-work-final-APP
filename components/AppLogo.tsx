import { Image } from 'react-native';

type Props = {
  size?: number;
  tone?: 'solid' | 'onNavy';
};

const logo = require('../assets/images/logo.png');

export function AppLogo({ size = 48 }: Props) {
  return (
    <Image
      source={logo}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityLabel="FindBack logo"
    />
  );
}