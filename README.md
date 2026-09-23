# Treino Jhow — React + lembretes de água

Versão atualizada do app de treino baseado no planejamento em PDF.

## O que já faz
- Treinos de segunda, terça, quinta e sexta.
- Séries, repetições e observações do planejamento.
- Marcação de exercícios concluídos.
- O “feito” fica salvo por data no próprio aparelho (`localStorage`).
- Campo de carga persistente por exercício.
- Água registrada por dia, meta diária e copo visual.
- Lembretes configuráveis de água: 30, 45, 60, 90, 120 ou 180 minutos.
- Horário de início e de término dos lembretes.
- Botão para testar a notificação.
- PWA/service worker para notificações do navegador enquanto o app web estiver ativo.
- Integração com Capacitor Local Notifications para notificações locais nativas em Android/iPhone, inclusive com o app fechado.

## Rodar no navegador
```bash
npm install
npm run dev
```

## Gerar versão nativa Android
```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

## Gerar versão nativa iPhone
> A compilação final para iPhone exige macOS + Xcode.

```bash
npm install
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

## Sobre o som do lembrete
As notificações nativas usam o sistema de notificações do aparelho. O app solicita som na notificação (`sound: "default"`) e, no iOS, ativa a apresentação com som. O som final também respeita as configurações de notificação, volume, modo silencioso/Não Perturbe e permissões definidas pelo usuário no aparelho.

No Android 8+, o som é controlado pelo canal de notificações do sistema. Se necessário, o usuário pode escolher o som do canal nas configurações de notificações do Android.

## Importante sobre navegador x app instalado
A Notifications API da web não garante um cronômetro contínuo quando a página está completamente fechada. Para o comportamento “fechei o app e mesmo assim ele toca no horário”, use a versão nativa com Capacitor.

## Observação
As animações dos exercícios ainda são ilustrativas. O componente `MovementDemo` pode ser trocado por GIFs/vídeos licenciados por exercício.
