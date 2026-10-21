/* Quanto o Daniel e o Yuri recebem em cada show.
   O cálculo é feito só no back (RegrasPagamento.java) e chega em cada show da API;
   aqui apenas lemos esses campos. */

export const pagamentoDaniel = show => show.pagamentoDaniel || 0;
export const pagamentoYuri   = show => show.pagamentoYuri   || 0;
