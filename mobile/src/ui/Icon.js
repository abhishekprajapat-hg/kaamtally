import React from 'react';
import { ArrowCircleUpRightIcon } from 'phosphor-react-native/src/icons/ArrowCircleUpRight';
import { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
import { BankIcon } from 'phosphor-react-native/src/icons/Bank';
import { BellIcon } from 'phosphor-react-native/src/icons/Bell';
import { BriefcaseIcon } from 'phosphor-react-native/src/icons/Briefcase';
import { BuildingsIcon } from 'phosphor-react-native/src/icons/Buildings';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { CalendarCheckIcon } from 'phosphor-react-native/src/icons/CalendarCheck';
import { CalendarPlusIcon } from 'phosphor-react-native/src/icons/CalendarPlus';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { ChartBarIcon } from 'phosphor-react-native/src/icons/ChartBar';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { ChecksIcon } from 'phosphor-react-native/src/icons/Checks';
import { CircleIcon } from 'phosphor-react-native/src/icons/Circle';
import { CircleDashedIcon } from 'phosphor-react-native/src/icons/CircleDashed';
import { CircleHalfIcon } from 'phosphor-react-native/src/icons/CircleHalf';
import { ClockCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ClockCounterClockwise';
import { CloudArrowUpIcon } from 'phosphor-react-native/src/icons/CloudArrowUp';
import { CurrencyInrIcon } from 'phosphor-react-native/src/icons/CurrencyInr';
import { DeviceMobileIcon } from 'phosphor-react-native/src/icons/DeviceMobile';
import { DotsThreeCircleIcon } from 'phosphor-react-native/src/icons/DotsThreeCircle';
import { DownloadSimpleIcon } from 'phosphor-react-native/src/icons/DownloadSimple';
import { GearIcon } from 'phosphor-react-native/src/icons/Gear';
import { HandCoinsIcon } from 'phosphor-react-native/src/icons/HandCoins';
import { HouseIcon } from 'phosphor-react-native/src/icons/House';
import { IdentificationCardIcon } from 'phosphor-react-native/src/icons/IdentificationCard';
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin';
import { MoneyIcon } from 'phosphor-react-native/src/icons/Money';
import { MoonIcon } from 'phosphor-react-native/src/icons/Moon';
import { NoteIcon } from 'phosphor-react-native/src/icons/Note';
import { NotebookIcon } from 'phosphor-react-native/src/icons/Notebook';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { PlusCircleIcon } from 'phosphor-react-native/src/icons/PlusCircle';
import { QuestionIcon } from 'phosphor-react-native/src/icons/Question';
import { ReceiptIcon } from 'phosphor-react-native/src/icons/Receipt';
import { ShareNetworkIcon } from 'phosphor-react-native/src/icons/ShareNetwork';
import { SignOutIcon } from 'phosphor-react-native/src/icons/SignOut';
import { SlidersIcon } from 'phosphor-react-native/src/icons/Sliders';
import { StorefrontIcon } from 'phosphor-react-native/src/icons/Storefront';
import { SunIcon } from 'phosphor-react-native/src/icons/Sun';
import { ToggleRightIcon } from 'phosphor-react-native/src/icons/ToggleRight';
import { TranslateIcon } from 'phosphor-react-native/src/icons/Translate';
import { UserIcon } from 'phosphor-react-native/src/icons/User';
import { UserMinusIcon } from 'phosphor-react-native/src/icons/UserMinus';
import { UserPlusIcon } from 'phosphor-react-native/src/icons/UserPlus';
import { UsersThreeIcon } from 'phosphor-react-native/src/icons/UsersThree';
import { WalletIcon } from 'phosphor-react-native/src/icons/Wallet';
import { LockKeyIcon } from 'phosphor-react-native/src/icons/LockKey';
import { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck';
import { WarningIcon } from 'phosphor-react-native/src/icons/Warning';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { XCircleIcon } from 'phosphor-react-native/src/icons/XCircle';
import { useTheme } from './theme-context';

const MAP = {
  'arrow-circle-up-right': ArrowCircleUpRightIcon, 'arrow-right': ArrowRightIcon, bank: BankIcon, bell: BellIcon, briefcase: BriefcaseIcon,
  buildings: BuildingsIcon, 'calendar-blank': CalendarBlankIcon, 'calendar-check': CalendarCheckIcon, 'calendar-plus': CalendarPlusIcon,
  'caret-left': CaretLeftIcon, 'caret-right': CaretRightIcon, 'caret-down': CaretDownIcon, 'chart-bar': ChartBarIcon, check: CheckIcon, 'check-circle': CheckCircleIcon,
  checks: ChecksIcon, circle: CircleIcon, 'circle-dashed': CircleDashedIcon, 'circle-half': CircleHalfIcon,
  'clock-counter-clockwise': ClockCounterClockwiseIcon, 'cloud-arrow-up': CloudArrowUpIcon, 'currency-inr': CurrencyInrIcon,
  'device-mobile': DeviceMobileIcon, 'dots-three-circle': DotsThreeCircleIcon, 'download-simple': DownloadSimpleIcon, gear: GearIcon,
  'hand-coins': HandCoinsIcon, house: HouseIcon, 'identification-card': IdentificationCardIcon, info: InfoIcon,
  'magnifying-glass': MagnifyingGlassIcon, 'map-pin': MapPinIcon, money: MoneyIcon, moon: MoonIcon, note: NoteIcon, notebook: NotebookIcon,
  'pencil-simple': PencilSimpleIcon, phone: PhoneIcon, plus: PlusIcon, 'plus-circle': PlusCircleIcon, question: QuestionIcon, receipt: ReceiptIcon,
  'share-network': ShareNetworkIcon, 'sign-out': SignOutIcon, sliders: SlidersIcon, storefront: StorefrontIcon, sun: SunIcon,
  'toggle-right': ToggleRightIcon, translate: TranslateIcon, user: UserIcon, 'user-minus': UserMinusIcon, 'user-plus': UserPlusIcon,
  'users-three': UsersThreeIcon, wallet: WalletIcon, 'lock-key': LockKeyIcon, 'shield-check': ShieldCheckIcon, warning: WarningIcon, 'warning-circle': WarningCircleIcon, 'x-circle': XCircleIcon
};

// Accepts the design's class strings: "ph-fill ph-check-circle", "ph ph-bell", "ph-check-circle" or "check-circle".
export function parseIcon(cls) {
  const parts = String(cls || '').trim().split(/\s+/);
  const fill = parts.includes('ph-fill');
  const nm = parts.filter((p) => p !== 'ph' && p !== 'ph-fill').pop() || '';
  return { name: nm.replace(/^ph-/, ''), fill };
}

export default function Icon({ name, fill, size = 20, color, style }) {
  const { c } = useTheme();
  const p = parseIcon(name);
  const Cmp = MAP[p.name];
  if (!Cmp) return null;
  return <Cmp size={size} color={c(color || 'var(--color-text)')} weight={fill || p.fill ? 'fill' : 'regular'} style={style} />;
}
