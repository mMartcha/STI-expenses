/**
 * Componentes visuais do app. Cada um vive em `<Nome>/index.tsx` + `styles.ts`; as props
 * ficam em `types/component.types.ts`. Grupos por funcionalidade (expense, report, capture…)
 * têm o seu próprio `index.ts`.
 *
 * Telas importam daqui: `import { Button, Card } from '@/presentation/components';`
 */

// Base
export { AppText } from './AppText';
export { Avatar } from './Avatar';
export { Button } from './Button';
export { Card } from './Card';
export { Checkbox } from './Checkbox';
export { ChipSelect } from './ChipSelect';
export { DateField } from './DateField';
export { Divider } from './Divider';
export { EmptyState } from './EmptyState';
export { Icon, type IconName } from './Icon';
export { IconButton } from './IconButton';
export { ListItem } from './ListItem';
export { LoadingState } from './LoadingState';
export { Notice } from './Notice';
export { Pill } from './Pill';
export { Row } from './Row';
export { SectionTitle } from './SectionTitle';
export { SegmentedControl } from './SegmentedControl';
export { SelectField } from './SelectField';
export { TextField } from './TextField';
export { TextLink } from './TextLink';

// Estrutura de tela
export { FormScreen } from './FormScreen';
export { PageHeader } from './PageHeader';

// Painéis e ações
export { ActionSheet, BottomSheet } from './BottomSheet';
export { CreateActions, CREATE_ACTIONS_CLEARANCE, useCreateActionsClearance } from './CreateActions';
export { FloatingActions } from './FloatingActions';
export { Dialog, DialogActions } from './Dialog';
export { DropdownMenu } from './DropdownMenu';
export { ReasonDialog } from './ReasonDialog';
export { Toast } from './Toast';
export { SyncBanner } from './SyncBanner';

// Por funcionalidade
export * from './capture';
export * from './expense';
export * from './history';
export * from './notices';
export * from './report';
