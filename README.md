# BuscaCEP

> Consulta rápida de endereços brasileiros a partir do CEP, com histórico local e temas claro/escuro.

Uma aplicação front-end leve, responsiva e pronta para publicação estática na Vercel. A busca acontece automaticamente ao completar os oito dígitos do CEP e utiliza a API pública do [ViaCEP](https://viacep.com.br/).

## Recursos

- Consulta automática ao informar um CEP válido (`00000-000`)
- Máscara de CEP aplicada em tempo real
- Estado de carregamento durante a requisição
- Exibição de logradouro, bairro, cidade e UF
- Mensagens amigáveis para CEP inexistente ou falhas de conexão
- Histórico das 5 últimas consultas bem-sucedidas, salvo no navegador
- Exclusão individual de itens do histórico ou limpeza completa
- Tema claro/escuro com preferência persistida
- Interface adaptada para telas pequenas e grandes

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| HTML5 | Estrutura semântica e acessível |
| JavaScript ES6+ | Lógica da aplicação, DOM e requisições assíncronas |
| Tailwind CSS (CDN) | Estilização utilitária e responsividade |
| Fetch API | Comunicação HTTP com o ViaCEP |
| Web Storage API | Histórico e preferência de tema no `localStorage` |

## Estrutura

```text
buscador-cep/
├── index.html    # Interface e configuração do Tailwind
├── script.js     # Serviço ViaCEP, estado visual, histórico e tema
└── README.md
```
## Como funciona

1. O campo recebe apenas números e os formata no padrão `XXXXX-XXX`.
2. Ao atingir oito dígitos, o app consulta `https://viacep.com.br/ws/{CEP}/json/`.
3. Enquanto a resposta não chega, um spinner é exibido no campo.
4. Em caso de sucesso, os dados são renderizados e a consulta entra no histórico.
5. Se o CEP não existir ou houver indisponibilidade de rede, o usuário recebe uma mensagem clara na interface.

Requisições anteriores são canceladas quando o CEP é alterado rapidamente, evitando que uma resposta antiga sobrescreva a mais recente.

## Experiência e acessibilidade

- Elementos HTML semânticos e rótulos associados aos campos.
- Mensagens de status com `aria-live` para leitores de tela.
- Botões com foco visível e rótulos acessíveis, inclusive para remover um único CEP.
- Campo numérico otimizado para teclados de dispositivos móveis.
- Tema salvo na chave `buscador-cep:theme`; sem escolha prévia, a preferência do sistema é utilizada.

## Dados armazenados no navegador

| Chave | Conteúdo |
| --- | --- |
| `buscador-cep:history` | Até cinco CEPs consultados com sucesso |
| `buscador-cep:theme` | Tema escolhido: `light` ou `dark` |

Nenhum dado é enviado a serviços além da consulta do CEP à API ViaCEP.
