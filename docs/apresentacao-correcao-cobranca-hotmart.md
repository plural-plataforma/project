# Correção no controle automático de assinaturas

## O problema que encontramos

Toda vez que alguém comprava a Plural pela Hotmart, o cadastro da professora era criado
automaticamente — isso já funcionava. O problema era outro: **a data de vencimento do acesso
nunca era preenchida sozinha**. Por isso era preciso entrar no painel administrativo e digitar
manualmente a data de expiração de cada pessoa, uma por uma, toda vez que alguém comprava ou
renovava.

## Por que isso acontecia

O sistema que recebe os avisos da Hotmart (toda compra gera um aviso automático, com os dados
do comprador e da assinatura) tinha uma falha de configuração: ele lia corretamente o nome e o
e-mail do comprador, mas não conseguia ler o campo com a data de vencimento. Esse campo sempre
chegava vazio, então o sistema nunca sabia até quando aquele acesso deveria durar — e por
segurança, deixava sem data (ou seja, acesso sem vencimento).

Além disso, quando alguém renovava a assinatura, o sistema via que a pessoa já tinha cadastro
e simplesmente ignorava o aviso da renovação — não atualizava nada.

## O que foi corrigido

- O sistema agora lê corretamente a data de vencimento que a Hotmart envia em cada compra.
- Essa data passa a ser a **data real da próxima cobrança** (a informação mais confiável que a
  Hotmart tem sobre até quando aquele acesso foi pago), em vez de um campo que não tinha
  relação nenhuma com o vencimento da assinatura.
- Quando uma assinante **renova**, o sistema agora atualiza automaticamente a data de
  vencimento dela, em vez de ignorar.
- Quando uma assinante **cancela**, o acesso continua valendo até o fim do período que ela já
  pagou (não é cortado na hora, o que seria injusto — ela pagou por aquele mês/ano).
- Se um pagamento é **reembolsado ou contestado no cartão**, o acesso é cortado
  imediatamente.
- Se a data de cobrança da assinatura for alterada (pela cliente ou pela professora, direto no
  painel da Hotmart), o vencimento no nosso sistema acompanha essa mudança automaticamente.
- Criamos uma verificação automática que roda **todo dia**, comparando nosso cadastro com o
  que a Hotmart tem registrado, e corrige sozinha qualquer diferença — uma segunda camada de
  segurança, caso algum aviso da Hotmart não chegue por algum motivo.

## O que isso muda no dia a dia

A partir de agora, o vencimento de acesso de cada professora deve se manter correto sozinho,
sem precisar editar manualmente no painel a cada nova venda ou renovação. O trabalho de
acompanhar planilha e digitar data por data deixa de ser necessário para os casos normais.

## O que ainda falta pra funcionar 100%

1. **Aplicar a atualização no banco de dados** — passo técnico simples, que já está pronto
   pra rodar.
2. **Conferir na Hotmart** se todos os tipos de aviso relevantes (renovação, cancelamento,
   reembolso, mudança de data de cobrança) estão marcados para serem enviados ao nosso
   sistema — é uma configuração no painel da Hotmart.
3. **Confirmar** que as credenciais de acesso à API da Hotmart estão configuradas no servidor
   (isso já deveria estar funcionando, pois é usado também na tela de vendas que já existe).

## Um ponto importante

Essa correção vale a partir de agora, para novos eventos. As professoras que já estão
cadastradas hoje continuam com a data que já têm no sistema (a maioria sem data de
vencimento, por causa da falha antiga) — corrigir os cadastros que já existem é uma etapa
separada, que pode ser feita depois, se for do interesse de vocês.
