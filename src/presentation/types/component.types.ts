import type { ReactNode } from 'react';
import type { PressableProps, StyleProp, TextInputProps, TextProps, ViewStyle } from 'react-native';

import type { Expense, ExpenseItem } from '@/domain/entities/Expense';
import type { ReportDetailsInput } from '@/domain/entities/ExpenseReport';
import type { Notice } from '@/domain/entities/Notice';
import type { AuditEntry } from '@/domain/entities/AuditEntry';
import type { CurrencyCode } from '@/domain/shared/Money';
import type { ReportListItem } from '@/domain/usecases/report/ListReportsUseCase';

import type { IconName } from '../components/Icon';
import type { PressScale } from '../hooks/usePressScale';
import type { PickedReceipt } from '../hooks/useReceiptCapture';
import type { ReportDetailsForm } from '../hooks/useReportDetailsForm';
import type { TypographyVariant } from '../theme/theme';

/**
 * Props de todos os componentes visuais, num lugar só (mesmo padrão do app-stara-ai).
 * Cada componente vive em `components/<Nome>/index.tsx` + `styles.ts`.
 */

// ---------- Texto ----------

export type TextTone = 'primary' | 'secondary' | 'tertiary' | 'brand';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  /** Sempre um papel do tema (`colors.*`); prefira `tone`. */
  color?: string;
  tone?: TextTone;
}

export interface TextLinkProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  /** Rótulo para leitores de tela quando o texto visível não basta. */
  accessibilityLabel?: string;
}

// ---------- Botões ----------

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  icon?: IconName;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * - `plain`: só o ícone (cabeçalhos);
 * - `filled`: círculo neutro elevado (setas, ações secundárias);
 * - `primary`: círculo laranja;
 * - `brandSoft`: estado "ligado" de um controle (fundo laranja-claro, ícone de marca);
 * - `media`: sobre foto/câmera (fundo escuro translúcido, ícone branco).
 */
export type IconButtonVariant = 'plain' | 'filled' | 'primary' | 'brandSoft' | 'media';

export interface IconButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  icon: IconName;
  /** Obrigatório: botão só com ícone precisa de nome para leitores de tela. */
  accessibilityLabel: string;
  variant?: IconButtonVariant;
  /** Diâmetro do círculo (padrão 44, o mínimo de toque). */
  size?: number;
  iconSize?: number;
  /** Força a cor do ícone (sempre um papel do tema). */
  color?: string;
  /** Ponto de "não lido"/pendência no canto. */
  showDot?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface AvatarProps {
  name: string | null | undefined;
  size?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
}

// ---------- Contêineres ----------

export interface CardProps {
  children: ReactNode;
  /** `brand`: destaque suave de marca (cards de resumo). */
  tone?: 'default' | 'muted' | 'brand';
  style?: StyleProp<ViewStyle>;
}

export interface FormScreenProps {
  children: ReactNode;
  /** CTA fixo no rodapé, fora da rolagem (sempre visível). */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Botão à esquerda (fechar/voltar). */
  leading?: { icon: IconName; accessibilityLabel: string; onPress: () => void };
  /** Ações à direita. */
  right?: ReactNode;
}

export interface SectionTitleProps {
  title: string;
  right?: ReactNode;
}

// ---------- Formulário ----------

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
  hint?: string;
}

export interface DateFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  /** Ícone ao lado do rótulo (usado pelo `SelectField`). */
  icon?: IconName;
}

export interface ChipSelectProps<T extends string> {
  label: string;
  options: readonly ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

export interface SelectFieldProps<T extends string> {
  label: string;
  options: readonly ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Texto do campo enquanto nada foi escolhido (padrão: "Selecionar"). */
  placeholder?: string;
  /** Campo opcional: mostra na lista uma opção que limpa o valor. */
  onClear?: () => void;
  /** Rótulo da opção de limpar (padrão: "Não informado"). */
  clearLabel?: string;
}

export interface CheckboxProps {
  checked: boolean;
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** `sm` = texto e altura menores (ex.: dentro de formulários). */
  size?: 'md' | 'sm';
}

// ---------- Feedback e estados ----------

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  /** Tempo na tela antes de sumir sozinho (ms). */
  duration?: number;
}

export type PillTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

export interface PillProps {
  label: string;
  tone?: PillTone;
  icon?: IconName;
}

export type NoticeTone = 'warning' | 'error' | 'info' | 'success';

export interface NoticeProps {
  tone: NoticeTone;
  icon: IconName;
  text: string;
  action?: ReactNode;
}

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  hint?: string;
  /** `illustrated`: ícone num círculo colorido e título maior (estados vazios de destaque). */
  appearance?: 'plain' | 'illustrated';
  /** Cor do círculo no modo `illustrated`. */
  accent?: 'brand' | 'secondary';
}

export interface RowProps {
  label: string;
  value: string;
  /** Ícone antes do rótulo (ex.: categoria). */
  icon?: IconName;
  strong?: boolean;
  valueColor?: string;
}

// ---------- Listas ----------

export type ListItemTone = 'neutral' | 'warning' | 'brand' | 'success' | 'error';

export interface ListItemProps {
  title: string;
  subtitle?: string | null;
  /** Máximo de linhas do subtítulo (padrão 2). */
  subtitleLines?: number;
  /** Ícone à esquerda, dentro de um círculo. */
  icon?: IconName;
  iconTone?: ListItemTone;
  /** Mostra o ponto de pendência antes da seta. */
  showDot?: boolean;
  /** Seta à direita (padrão: aparece quando há `onPress`). */
  showChevron?: boolean;
  /** Conteúdo extra à direita (ex.: selo "Novo"). */
  trailing?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

// ---------- Painéis ----------

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Roda quando o painel saiu de vez da tela (use para navegar). */
  onDismissed?: () => void;
  children: ReactNode;
}

export interface ActionSheetItem {
  key: string;
  icon: IconName;
  label: string;
  description?: string;
  onPress: () => void;
}

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  /** Intensidade da animação de toque (padrão: `button`). */
  scale?: PressScale;
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
}

export interface DropdownMenuItem {
  key: string;
  icon: IconName;
  label: string;
  /** Texto e ícone em vermelho (ex.: sair). */
  destructive?: boolean;
  onPress: () => void;
}

export interface DropdownMenuProps {
  items: readonly DropdownMenuItem[];
  /** Rótulo do gatilho para leitores de tela (ex.: "Abrir menu da conta"). */
  accessibilityLabel: string;
  /** Desenho do gatilho (sem `onPress` próprio: o menu é o botão). */
  children: ReactNode;
}

export interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  items: readonly ActionSheetItem[];
}

export interface DialogProps {
  visible: boolean;
  title: string;
  message?: string;
  /** Tocar fora / "voltar" do Android. */
  onClose: () => void;
  /** `false` = só fecha pelos botões. */
  dismissable?: boolean;
  children?: ReactNode;
}

export interface DialogActionsProps {
  confirmLabel: string;
  /** Sem rótulo (ou sem `onCancel`), mostra só a ação principal. */
  cancelLabel?: string | null;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface ReasonDialogProps {
  visible: boolean;
  title: string;
  message: string;
  placeholder: string;
  confirmLabel: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export interface FloatingActionsProps {
  onScan: () => void;
  onCreate: () => void;
}

// ---------- Domínio: despesas ----------

export type ReceiptThumbnailSize = 'sm' | 'md' | 'lg';

export interface ReceiptThumbnailProps {
  /** Comprovante salvo (`localUri`) ou recém-escolhido (`uri`); `null` = despesa sem nota. */
  receipt: ({ mimeType: string | null } & ({ localUri: string } | { uri: string })) | null;
  size?: ReceiptThumbnailSize;
  /** Ícone mostrado quando não há comprovante (padrão: `manual`). */
  placeholderIcon?: IconName;
  /** Torna a miniatura tocável (ex.: abrir o comprovante em tela cheia). */
  onPress?: () => void;
  accessibilityLabel?: string;
}

export interface ExpenseRowProps {
  expense: Expense;
  showDate?: boolean;
}

export interface ExpenseItemRowProps {
  expense: Expense;
  item: ExpenseItem;
  editable: boolean;
  busy: boolean;
  onRemove?: () => void;
  onRestore?: () => void;
}

export interface ExpenseSelectRowProps {
  expense: Expense;
  checked: boolean;
  onToggle: () => void;
  /** Não selecionável (ex.: já está em outro relatório). */
  disabled?: boolean;
  /** Motivo exibido abaixo da despesa quando `disabled`. */
  hint?: string | null;
}

export interface ManualExpenseFormProps {
  reportId?: string | null;
  onSaved: (expense: Expense) => void;
}

// ---------- Domínio: relatórios, avisos, histórico ----------

export interface ReportCardProps {
  report: ReportListItem['report'];
  /** Total e quantidade (lista de relatórios); omitidos na escolha de relatório. */
  summary?: Pick<ReportListItem, 'total' | 'expenseCount'>;
  onPress?: () => void;
  disabled?: boolean;
}

export interface ApprovalProgressProps {
  /** Relatório enviado (`SUBMITTED`) com total e quantidade de despesas. */
  item: ReportListItem;
  onPress: () => void;
}

/** `range` = intervalo contínuo; `days` = dias avulsos (ex.: 26/10 e 29/10). */
export type ReportDateMode = 'range' | 'days';

export interface ReportFormProps {
  initial?: Partial<ReportDetailsInput>;
  submitLabel: string;
  loading: boolean;
  onSubmit: (input: ReportDetailsInput) => void;
}

export interface ReportDetailsFieldsProps {
  form: ReportDetailsForm;
  /** Período (entra entre o motivo e o adiantamento). */
  children?: ReactNode;
}

export interface PeriodExpensePickerProps {
  /** Período (YYYY-MM-DD, inclusive). */
  startDate: string;
  endDate: string;
  /** Relatório sendo montado: as despesas dele já não aparecem para seleção. */
  reportId?: string | null;
  selected: ReadonlySet<string>;
  onChange: (selected: Set<string>) => void;
  footer: ReactNode;
}

export interface NoticeRowProps {
  notice: Notice;
  onPress: () => void;
  /** Mostra data e selo "Novo" (tela de avisos); a home mostra só o essencial. */
  detailed?: boolean;
}

export interface HistoryTimelineProps {
  entries: readonly AuditEntry[];
  currency: CurrencyCode;
  describeTarget?: (targetId: string) => string | null;
  /** Destaca o que mudou depois do envio para aprovação. */
  submittedAt?: string | null;
}

// ---------- Captura ----------

export interface CameraStepProps {
  batch: boolean;
  onBatchChange: (batch: boolean) => void;
  receipts: PickedReceipt[];
  onAdd: (receipts: PickedReceipt[]) => void;
  onRemove: (key: string) => void;
  onReview: () => void;
}

export interface ReviewStepProps {
  receipts: PickedReceipt[];
  index: number;
  onIndexChange: (index: number) => void;
  onBack: () => void;
  onRemove: (key: string) => void;
  onRegistered: (count: number) => void;
}

export interface CameraPermissionPromptProps {
  canAskAgain: boolean;
  onContinue: () => void;
}

export interface ReceiptStripProps {
  receipts: PickedReceipt[];
  onRemove: (key: string) => void;
  onReview: () => void;
}

export interface BatchTipProps {
  visible: boolean;
  onClose: () => void;
}
