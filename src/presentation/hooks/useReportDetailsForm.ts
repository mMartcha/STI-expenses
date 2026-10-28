import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { ReportDetailsInput } from '@/domain/entities/ExpenseReport';

import { centsToInput, parseMoneyInput } from '../utils/format';

const formSchema = z.object({
  title: z.string().trim().min(1, 'required').max(120),
  purpose: z.string().trim().max(500),
  costCenter: z.string().trim().max(40),
  advance: z.string().refine((value) => value.trim() === '' || parseMoneyInput(value) !== null, 'invalidAmount'),
});

type FieldName = keyof z.infer<typeof formSchema>;
/** Dados do relatório sem o período (cada tela monta o período do seu jeito). */
export type ReportDetailsValues = Omit<ReportDetailsInput, 'startDate' | 'endDate'>;

/**
 * Estado e validação dos campos comuns do relatório (título, motivo, centro de custo,
 * adiantamento). Usado na criação e na edição; o período fica a cargo de cada tela.
 */
export function useReportDetailsForm(initial?: Partial<ReportDetailsInput>) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [purpose, setPurpose] = useState(initial?.purpose ?? '');
  // Centro de custo oculto por ora (ver `ReportDetailsFields`); o valor existente é preservado.
  const [costCenter] = useState(initial?.costCenter ?? '');
  const [advance, setAdvance] = useState(initial?.advance ? centsToInput(initial.advance) : '');
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});

  /** Valida e mostra os erros nos campos; devolve `null` se algo estiver inválido. */
  const validate = (): ReportDetailsValues | null => {
    const parsed = formSchema.safeParse({ title, purpose, costCenter, advance });
    if (!parsed.success) {
      const next: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        next[issue.path[0] as FieldName] = t(`errors.${issue.message as 'required'}`, { defaultValue: t('errors.required') });
      }
      setErrors(next);
      return null;
    }
    setErrors({});
    return {
      title: parsed.data.title,
      purpose: parsed.data.purpose || null,
      costCenter: parsed.data.costCenter || null,
      advance: parseMoneyInput(advance),
    };
  };

  return { title, setTitle, purpose, setPurpose, advance, setAdvance, errors, validate };
}

export type ReportDetailsForm = ReturnType<typeof useReportDetailsForm>;
