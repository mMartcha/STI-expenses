import { useTranslation } from 'react-i18next';

import type { NoticeType } from '@/domain/entities/Notice';

import type { ListItemTone, NoticeRowProps } from '../../types/component.types';
import { formatDateTime } from '../../utils/format';
import type { IconName } from '../Icon';
import { ListItem } from '../ListItem';
import { Pill } from '../Pill';

const ICON: Record<NoticeType, IconName> = {
  REPORT_APPROVED: 'check',
  REPORT_REJECTED: 'warning',
  OCR_FAILED: 'receipt',
  SYNC_FAILED: 'offline',
};

const TONE: Record<NoticeType, ListItemTone> = {
  REPORT_APPROVED: 'success',
  REPORT_REJECTED: 'error',
  OCR_FAILED: 'warning',
  SYNC_FAILED: 'error',
};

/**
 * Um aviso (decisão do gestor, nota ilegível, falha de envio). Na Início aparece enxuto,
 * como pendência; na tela de avisos (`detailed`) mostra também a data e o selo "Novo".
 */
export function NoticeRow({ notice, onPress, detailed = false }: NoticeRowProps) {
  const { t } = useTranslation();
  const label = notice.type !== 'SYNC_FAILED' ? notice.targetLabel : null;
  const hint =
    notice.type === 'OCR_FAILED' ? t('notices.OCR_FAILED_hint') : notice.type === 'SYNC_FAILED' ? t('notices.SYNC_FAILED_hint') : null;
  const date = detailed && notice.type !== 'SYNC_FAILED' ? formatDateTime(notice.at) : null;
  const subtitle = detailed ? [label, hint, date].filter(Boolean).join('\n') : (label ?? hint);

  return (
    <ListItem
      icon={ICON[notice.type]}
      iconTone={TONE[notice.type]}
      title={t(`notices.${notice.type}`, { count: Number(notice.targetLabel) })}
      subtitle={subtitle}
      subtitleLines={detailed ? 3 : 1}
      showDot={notice.requiresAction}
      trailing={detailed && notice.unread && !notice.requiresAction ? <Pill tone="primary" label={t('notices.new')} /> : null}
      onPress={onPress}
    />
  );
}
