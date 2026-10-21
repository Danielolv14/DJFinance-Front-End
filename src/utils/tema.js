/* Cores e estilos visuais compartilhados entre as telas. */

export const STATUS_COR = { CONFIRMADO: '#3dd457', PENDENTE: '#ffd60a', CANCELADO: '#ff453a' };

/** Cartão escuro padrão das telas. */
export const superficie = {
  background: '#13141a',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 8,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
};

/** Cor de cada aba; cada tela usa a sua como destaque. */
export const COR_ABA = {
  dashboard:  '#4d8fff',
  calendario: '#3dd457',
  shows:      '#9a7ef8',
  crm:        '#ff8040',
  cadastro:   '#ffd60a',
  fechamento: '#ff6058',
  presskit:   '#22d3ee',
};
