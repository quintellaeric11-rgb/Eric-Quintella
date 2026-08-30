from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import landscape
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.lib.utils import ImageReader
from pathlib import Path
import os, textwrap

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output/pdf/KONKI_Founder_Brief.pdf"
W, H = 960, 540
INK = HexColor('#0D0F12'); PAPER = HexColor('#F5F3EC'); WHITE = HexColor('#FFFFFF')
GREEN = HexColor('#8BCF35'); FOREST = HexColor('#183F35'); MUTED = HexColor('#777C76')
LINE = HexColor('#D9D9D1'); PALE = HexColor('#E8EEDC'); RED = HexColor('#C94C43'); AMBER = HexColor('#D59B2D')

font_candidates = [
    ('Inter', '/System/Library/Fonts/Supplemental/Arial.ttf', '/System/Library/Fonts/Supplemental/Arial Bold.ttf'),
    ('Helvetica', None, None)
]
FONT='Helvetica'; BOLD='Helvetica-Bold'
for name, reg, bold in font_candidates:
    if reg and Path(reg).exists() and Path(bold).exists():
        pdfmetrics.registerFont(TTFont(name, reg)); pdfmetrics.registerFont(TTFont(name+'-Bold', bold))
        FONT=name; BOLD=name+'-Bold'; break
def jp_title(c, x, y):
    # Rasterize only the two Japanese glyphs with the native macOS CJK font.
    from PIL import Image, ImageDraw, ImageFont
    p = ROOT / 'tmp/pdfs/konki-japanese.png'; p.parent.mkdir(parents=True, exist_ok=True)
    im = Image.new('RGBA', (280, 110), (0,0,0,0)); d = ImageDraw.Draw(im)
    f = ImageFont.truetype('/System/Library/Fonts/Hiragino Sans GB.ttc', 82)
    d.text((0,-8), '根気', font=f, fill=(255,255,255,255)); im.save(p)
    c.drawImage(str(p), x, y, width=140, height=55, mask='auto', preserveAspectRatio=True)

def bg(c, color=INK): c.setFillColor(color); c.rect(0,0,W,H,fill=1,stroke=0)
def line(c,x1,y1,x2,y2,color=LINE,width=1): c.setStrokeColor(color); c.setLineWidth(width); c.line(x1,y1,x2,y2)
def rect(c,x,y,w,h,fill,stroke=None,r=18,width=1):
    c.setFillColor(fill); c.setStrokeColor(stroke or fill); c.setLineWidth(width); c.roundRect(x,y,w,h,r,fill=1,stroke=1 if stroke else 0)
def txt(c,s,x,y,size=18,color=INK,font=FONT,leading=None,maxw=None):
    c.setFillColor(color); c.setFont(font,size); leading=leading or size*1.18
    lines=[]
    for para in str(s).split('\n'):
        if maxw:
            words=para.split(); row=''
            for w in words:
                test=(row+' '+w).strip()
                if stringWidth(test,font,size)<=maxw: row=test
                else:
                    if row: lines.append(row)
                    row=w
            lines.append(row)
        else: lines.append(para)
    for i,row in enumerate(lines): c.drawString(x,y-i*leading,row)
    return y-len(lines)*leading
def label(c,s,x,y,color=GREEN): txt(c,s.upper(),x,y,10,color,BOLD); return y-18
def headline(c,s,x,y,size=38,color=INK,maxw=800): return txt(c,s,x,y,size,color,BOLD,size*1.03,maxw)
def footer(c,n,dark=False):
    col=Color(1,1,1,.45) if dark else MUTED
    txt(c,'KONKI  /  FOUNDER BRIEF',54,24,8,col,BOLD); txt(c,f'{n:02d}',886,24,8,col,BOLD)
def mark(c,x,y,size=54,box=True):
    if box: rect(c,x,y,size,size,INK,None,size*.22)
    sx=size/512; ox=x; oy=y
    c.setFillColor(GREEN)
    def path(points):
        p=c.beginPath(); p.moveTo(ox+points[0][0]*sx,oy+(512-points[0][1])*sx)
        for px,py in points[1:]: p.lineTo(ox+px*sx,oy+(512-py)*sx)
        p.close(); c.drawPath(p,fill=1,stroke=0)
    path([(132,94),(210,94),(210,251),(132,336)])
    path([(230,94),(380,94),(242,244),(171,179)])
    path([(132,286),(243,165),(386,418),(270,418),(196,290),(168,418),(132,418)])
def logo(c,x,y,dark=False,scale=1):
    mark(c,x,y,46*scale,True); col=WHITE if dark else INK
    txt(c,'KONKI',x+60*scale,y+27*scale,18*scale,col,BOLD)
    txt(c,'Aprenda a conquistar.',x+60*scale,y+10*scale,8*scale,GREEN,BOLD)
def tag(c,s,x,y,kind='HIPÓTESE'):
    colors={'HIPÓTESE':AMBER,'RISCO':RED,'OPORTUNIDADE':GREEN,'VISÃO FUTURA':GREEN,'ILUSTRATIVO':AMBER,'ASSUNÇÃO':MUTED,'FATO':FOREST}
    col=colors.get(kind,GREEN); w=stringWidth(s,BOLD,9)+22
    rect(c,x,y-5,w,24,col,None,12); txt(c,s,x+11,y+3,9,WHITE if kind!='OPORTUNIDADE' else INK,BOLD); return w
def bullets(c,items,x,y,size=14,color=INK,gap=29,maxw=350,accent=GREEN):
    for item in items:
        c.setFillColor(accent); c.circle(x,y+4,3,fill=1,stroke=0)
        y=txt(c,item,x+16,y,size,color,FONT,size*1.25,maxw)-gap+size*1.25
    return y
def card(c,x,y,w,h,title,body='',dark=False,accent=None):
    fill=FOREST if dark else WHITE; col=WHITE if dark else INK
    rect(c,x,y,w,h,fill,LINE if not dark else None,18)
    if accent: c.setFillColor(accent); c.rect(x,y+h-6,w,6,fill=1,stroke=0)
    txt(c,title,x+20,y+h-34,15,col,BOLD,maxw=w-40)
    if body: txt(c,body,x+20,y+h-66,11,Color(1,1,1,.65) if dark else MUTED,FONT,15,w-40)
def arrow(c,x1,y1,x2,y2,color=GREEN,width=3):
    c.setStrokeColor(color); c.setFillColor(color); c.setLineWidth(width); c.line(x1,y1,x2,y2)
    import math
    a=math.atan2(y2-y1,x2-x1); l=9
    p=c.beginPath(); p.moveTo(x2,y2); p.lineTo(x2-l*math.cos(a-.5),y2-l*math.sin(a-.5)); p.lineTo(x2-l*math.cos(a+.5),y2-l*math.sin(a+.5)); p.close(); c.drawPath(p,fill=1,stroke=0)
def page(c,n,dark=False,section=None):
    bg(c,INK if dark else PAPER)
    if section: label(c,section,54,490)
    footer(c,n,dark)

def build():
    c=canvas.Canvas(str(OUT),pagesize=(W,H)); c.setTitle('KONKI Founder Brief'); c.setAuthor('KONKI')
    # 01 capa
    bg(c,INK); mark(c,54,418,52); txt(c,'KONKI',54,335,62,WHITE,BOLD); txt(c,'Aprenda a conquistar.',58,295,18,GREEN,BOLD)
    headline(c,'Uma nova forma de transformar\ndesejo em desenvolvimento.',54,185,35,WHITE,760)
    line(c,54,72,906,72,Color(1,1,1,.16)); txt(c,'FOUNDER BRIEF  /  2026',54,48,9,Color(1,1,1,.5),BOLD); c.showPage()
    # 02
    page(c,2,False,'A IDEIA EM UMA FRASE'); headline(c,'Jovens não querem necessariamente aprender.\nEles querem conquistar coisas.',54,430,39,INK,820)
    cards=[('JOVEM','“Eu quero isso.”'),('PAIS','“Quero que você aprenda a conquistar.”'),('KONKI','transforma uma coisa na outra.')]
    for i,(a,b) in enumerate(cards): card(c,54+i*288,115,260,112,a,b,dark=i==2,accent=GREEN if i==2 else None)
    txt(c,'Nossa hipótese: conectar um desejo do jovem ao desenvolvimento que os pais valorizam.',54,77,14,MUTED,FONT,maxw=780); c.showPage()
    # 03
    page(c,3,True,'O PROBLEMA'); headline(c,'Existe um desalinhamento\nde incentivos dentro de casa.',54,425,39,WHITE,700)
    card(c,54,115,390,210,'PAIS QUEREM','responsabilidade  /  autonomia\neducação financeira  /  disciplina\ncomunicação  /  iniciativa\ndecisão  /  vida adulta',False, GREEN)
    card(c,516,115,390,210,'JOVENS QUEREM','videogame  /  celular  /  tênis\nviagem  /  show  /  experiências\nindependência  /  dinheiro',True, GREEN)
    txt(c,'E se aquilo que o jovem já quer pudesse financiar sua vontade de evoluir?',54,78,15,GREEN,BOLD,maxw=800); txt(c,'Financiar no sentido de motivação, não de dinheiro.',54,55,10,Color(1,1,1,.5)); c.showPage()
    # 04
    page(c,4,False,'A TESE'); headline(c,'O desejo não é o problema.\nPode ser o combustível.',54,428,43,INK,620)
    txt(c,'Em vez de começar pelo conteúdo, começamos por um objetivo que já tem valor para o jovem.',54,322,15,MUTED,FONT,maxw=680)
    steps=['QUERO UM PS5','O QUE PRECISO FAZER?','MISSÕES + ESFORÇO + APRENDIZADO','PROGRESSO','CONQUISTA']
    x=54
    for i,s in enumerate(steps):
        w=[130,155,230,112,112][i]; rect(c,x,137,w,70,FOREST if i in (0,4) else WHITE,LINE,16); txt(c,s,x+13,173,10,WHITE if i in (0,4) else INK,BOLD,maxw=w-26)
        if i<len(steps)-1: arrow(c,x+w+5,172,x+w+20,172)
        x+=w+26
    c.showPage()
    # 05
    page(c,5,True,'O PRINCÍPIO'); headline(c,'Não é sobre ganhar\num PlayStation.',54,425,43,WHITE,600)
    txt(c,'O PlayStation é apenas o objetivo visível.',54,318,16,GREEN,BOLD)
    skills=['responsabilidade','paciência','organização','comunicação','educação financeira','negociação','empreendedorismo','tomada de decisão','capacidade de execução']
    for i,s in enumerate(skills):
        x=54+(i%3)*286; y=250-(i//3)*50; rect(c,x,y,258,35,Color(1,1,1,.06),Color(1,1,1,.12),12); txt(c,s,x+15,y+12,11,WHITE,FONT)
    headline(c,'O objeto é a motivação.\nO desenvolvimento acontece no caminho.',54,78,20,GREEN,820); c.showPage()
    # 06
    page(c,6,False,'CORE LOOP'); headline(c,'Como a KONKI pretende funcionar.',54,430,39,INK,700)
    steps=['DESEJO','OBJETIVO','CONTRATO','MISSÕES','PROVA','XP + PROGRESSO','CONQUISTA','REGISTRO','PRÓXIMA']
    for i,s in enumerate(steps):
        x=60+(i%5)*174; y=252 if i<5 else 128
        rect(c,x,y,142,65,FOREST if i in (0,6) else WHITE,LINE,16); txt(c,s,x+15,y+31,10,WHITE if i in (0,6) else INK,BOLD,maxw=112)
        if i not in (4,8): arrow(c,x+145,y+32,x+166,y+32)
    arrow(c,846,250,846,215); arrow(c,846,215,758,193)
    txt(c,'Loop proposto. A recorrência após a primeira conquista ainda precisa ser validada.',54,77,12,MUTED); c.showPage()
    # 07
    page(c,7,False,'EXEMPLO'); tag(c,'ILUSTRATIVO',54,456,'ILUSTRATIVO'); headline(c,'Eric, 14 anos. Um objetivo,\nvárias competências.',54,415,35,INK,600)
    card(c,650,338,256,118,'PLAYSTATION 5','R$ 3.499  /  6 meses\nValor e prazo apenas ilustrativos.',True,GREEN)
    missions=[('COMPARAR 3 LOJAS','decisão + pesquisa'),('LER E DISCORDAR','leitura + pensamento crítico'),('ORÇAR SEM PARCELAR','educação financeira'),('ENTREVISTAR A FAMÍLIA','comunicação'),('GANHAR OS PRIMEIROS R$ 20','iniciativa + execução')]
    for i,(a,b) in enumerate(missions):
        x=54+(i%3)*290; y=205-(i//3)*96; card(c,x,y,266,76,a,b,False,GREEN)
    c.showPage()
    # 08
    page(c,8,True,'HIPÓTESE DE PRODUTO'); tag(c,'HIPÓTESE DE PRODUTO',54,456,'HIPÓTESE'); headline(c,'A promessa precisa\nvaler dos dois lados.',54,410,40,WHITE,520)
    card(c,54,125,390,180,'JOVEM','define o objetivo\naceita regras, prazo e condições\nassume a jornada',False,GREEN)
    card(c,516,125,390,180,'RESPONSÁVEL','concorda com o combinado\nacompanha evidências\ncumpre a recompensa',True,GREEN)
    txt(c,'A KONKI não organiza apenas tarefas. Ela pretende organizar confiança.',54,80,17,GREEN,BOLD,maxw=800); c.showPage()
    # 09
    page(c,9,False,'PROOF OF EFFORT'); tag(c,'OPORTUNIDADE DE MOAT',54,456,'OPORTUNIDADE'); headline(c,'Pontos são fáceis.\nProvar esforço é difícil.',54,410,40,INK,580)
    txt(c,'Com IA, respostas simples podem ser terceirizadas. A hipótese é validar esforço com evidências mais ricas.',54,305,14,MUTED,maxw=720)
    proofs=['áudio de reflexão','vídeo curto','pergunta dinâmica','defesa de 3 minutos','evidência de projeto','resultado no mundo real','validação do responsável','peer review seguro']
    for i,s in enumerate(proofs):
        x=54+(i%4)*214; y=205-(i//4)*60; rect(c,x,y,192,40,WHITE,LINE,12); txt(c,s,x+14,y+14,10,INK,BOLD,maxw=164)
    txt(c,'O conteúdo pode ser copiado. Um histórico confiável de esforço é mais difícil de copiar.',54,76,14,FOREST,BOLD,maxw=830); c.showPage()
    # 10
    page(c,10,True,'GAMIFICAÇÃO'); headline(c,'Gamificação sem transformar\ndesenvolvimento em cassino.',54,430,38,WHITE,760)
    for i,(a,b) in enumerate([('XP','desenvolvimento e experiência'),('PROGRESSO','proximidade da conquista'),('DINHEIRO','dinheiro real')]): card(c,54+i*288,250,260,108,a,b,i==1,GREEN)
    txt(c,'NÍVEL 7',54,170,12,GREEN,BOLD); txt(c,'2.840 XP',54,135,28,WHITE,BOLD)
    txt(c,'PS5',334,170,12,GREEN,BOLD); rect(c,334,135,260,12,Color(1,1,1,.14),None,6); rect(c,334,135,120,12,GREEN,None,6); txt(c,'46% conquistado',334,110,12,WHITE,BOLD)
    txt(c,'6 semanas  /  12 missões',670,140,15,WHITE,BOLD)
    txt(c,'Princípio do MVP: XP nunca se converte diretamente em dinheiro. Sem loot boxes ou recompensa aleatória.',54,67,10,Color(1,1,1,.55),maxw=850); c.showPage()
    # 11
    page(c,11,False,'EXPERIÊNCIA DO JOVEM'); headline(c,'Não pode parecer escola.',54,430,44,INK,660)
    principles=['objetivos escolhidos','missões curtas','progresso visual','níveis e XP','sequência','conquistas','desafios reais','feedback rápido','autonomia']
    for i,s in enumerate(principles):
        x=54+(i%3)*286; y=290-(i//3)*58; rect(c,x,y,258,42,WHITE,LINE,14); txt(c,f'{i+1:02d}',x+14,y+15,9,GREEN,BOLD); txt(c,s,x+48,y+15,11,INK,BOLD)
    headline(c,'Escolha algo que você quer.\nA KONKI ajuda você a aprender a conquistar.',54,88,19,FOREST,780); c.showPage()
    # 12
    page(c,12,True,'EXPERIÊNCIA DOS PAIS'); headline(c,'Para os pais, não vendemos tarefas.\nVendemos desenvolvimento visível.',54,430,37,WHITE,820)
    card(c,54,110,470,230,'DASHBOARD DO RESPONSÁVEL','objetivo atual  /  progresso\nmissões concluídas  /  evidências\nhabilidades trabalhadas  /  sequência\nrelatório semanal  /  histórico\nContrato de Conquista',False,GREEN)
    rect(c,566,110,340,230,Color(1,1,1,.06),Color(1,1,1,.12),22); txt(c,'OBJETIVO ATUAL',592,306,9,GREEN,BOLD); txt(c,'PlayStation 5',592,270,25,WHITE,BOLD); rect(c,592,233,278,10,Color(1,1,1,.15),None,5); rect(c,592,233,128,10,GREEN,None,5); txt(c,'46%',592,201,21,GREEN,BOLD); txt(c,'12 missões  /  6 semanas',650,204,11,WHITE,BOLD); txt(c,'Desenvolvimento percebido',592,158,10,Color(1,1,1,.55)); txt(c,'organização  +  iniciativa',592,132,13,WHITE,BOLD)
    txt(c,'Copy de teste: “Pare de simplesmente dar coisas. Ajude seu filho a aprender a conquistá-las.”',54,70,10,Color(1,1,1,.48),maxw=850); c.showPage()
    # 13
    page(c,13,False,'VISÃO DE LONGO PRAZO'); tag(c,'VISÃO DE LONGO PRAZO',54,456,'VISÃO FUTURA'); headline(c,'E se cinco anos de esforço\nnão desaparecessem?',54,410,40,INK,620)
    items=['livros','projetos','missões','negociações','apresentações','objetivos','conquistas','habilidades','experiências','evidências']
    rect(c,560,110,346,300,FOREST,None,24); txt(c,'PASSAPORTE KONKI',586,374,11,GREEN,BOLD); txt(c,'Eric Quintella',586,330,25,WHITE,BOLD); txt(c,'13 → 18 anos',586,300,12,Color(1,1,1,.55));
    for i,s in enumerate(items): txt(c,'• '+s,586+(i%2)*145,250-(i//2)*32,11,WHITE)
    txt(c,'Os pontos são o jogo. O histórico pode se tornar o ativo.',54,165,18,FOREST,BOLD,maxw=430)
    tag(c,'HIPÓTESE: valor externo para universidades, bolsas e trabalho',54,110,'HIPÓTESE'); c.showPage()
    # 14
    page(c,14,True,'RETENÇÃO'); headline(c,'A primeira conquista\nnão pode ser o final.',54,425,42,WHITE,610)
    loop=['PRIMEIRO OBJETIVO','CONQUISTA','“EU CONSIGO”','NOVO OBJETIVO','JORNADA MAIS DIFÍCIL','NOVAS HABILIDADES','HISTÓRICO MAIOR']
    x=54
    for i,s in enumerate(loop):
        w=105 if i not in (4,5) else 125; rect(c,x,245,w,72,Color(1,1,1,.07),Color(1,1,1,.15),14); txt(c,s,x+12,278,9,GREEN if i==2 else WHITE,BOLD,maxw=w-24)
        if i<len(loop)-1: arrow(c,x+w+4,281,x+w+20,281)
        x+=w+24
    txt(c,'Depois de conquistar o primeiro PS5, por que esse jovem abriria a KONKI amanhã?',54,165,22,GREEN,BOLD,maxw=810)
    txt(c,'Hipótese crítica: se a única resposta for “para ganhar outro prêmio”, o produto pode virar apenas um sistema sofisticado de mesada.',54,102,12,Color(1,1,1,.62),maxw=820); c.showPage()
    # 15
    page(c,15,False,'ECOSSISTEMA'); headline(c,'Usuário ≠ pagador ≠ distribuidor.',54,430,40,INK,800)
    cols=[('USUÁRIO','Jovem'),('PAGADOR INICIAL','Pais / responsáveis'),('DISTRIBUIDORES FUTUROS','Creators / famílias / escolas / empresas / marcas'),('FINANCIADORES POSSÍVEIS','Pais / avós / padrinhos / tios / familiares')]
    for i,(a,b) in enumerate(cols): card(c,54+(i%2)*426,240-(i//2)*130,398,104,a,b,i==0,GREEN)
    txt(c,'Cada papel exige uma proposta de valor, uma permissão e um incentivo diferentes.',54,74,13,MUTED); c.showPage()
    # 16
    page(c,16,True,'ICP INICIAL'); tag(c,'HIPÓTESE DE SEGMENTO',54,456,'HIPÓTESE'); headline(c,'O primeiro grupo que\nqueremos testar.',54,410,40,WHITE,520)
    bullets(c,['pais de 35 a 55 anos','filhos aproximadamente de 12 a 16 anos','classe A/B inicialmente','valorizam educação e desenvolvimento','preocupam-se com passividade e responsabilidade','querem desenvolver autonomia','podem bancar recompensas'],540,376,13,WHITE,31,340,GREEN)
    txt(c,'Não é mercado validado. É um recorte operacional para aprender mais rápido.',54,93,15,GREEN,BOLD,maxw=820); c.showPage()
    # 17
    page(c,17,False,'MODELO DE NEGÓCIO'); headline(c,'Como a KONKI pode\nganhar dinheiro?',54,430,40,INK,560)
    phases=[('1','ASSINATURA B2C','possível plano familiar'),('2','GOAL FUND','com parceiro regulado'),('3','COMÉRCIO','afiliados / marketplace / take rate'),('4','B2B2C','benefício para filhos'),('5','INSTITUIÇÕES','escolas / programas'),('6','MARCAS','desafios patrocinados')]
    for i,(n,a,b) in enumerate(phases):
        x=54+(i%3)*286; y=240-(i//3)*108; card(c,x,y,258,86,f'{n}  {a}',b,i==0,GREEN)
    tag(c,'Além da assinatura inicial, tudo é hipótese',54,82,'HIPÓTESE'); c.showPage()
    # 18
    page(c,18,True,'OPORTUNIDADE DE COMÉRCIO'); tag(c,'VISÃO FUTURA',54,456,'VISÃO FUTURA'); headline(c,'A wishlist pode revelar\ndemanda futura.',54,410,40,WHITE,560)
    txt(c,'Se validada e em escala, a KONKI poderia conhecer:',54,305,14,Color(1,1,1,.58))
    facts=['o que desejam','quanto falta','quando podem comprar','categoria','faixa de preço']
    for i,s in enumerate(facts): rect(c,54+i*170,220,148,48,Color(1,1,1,.07),Color(1,1,1,.12),14); txt(c,s,68+i*170,238,10,WHITE,BOLD,maxw=120)
    headline(c,'A assinatura pode monetizar o desenvolvimento.\nA conquista pode, eventualmente, monetizar o comércio.',54,130,18,GREEN,800)
    txt(c,'Possibilidade, não operação atual.',54,75,10,Color(1,1,1,.45)); c.showPage()
    # 19
    page(c,19,False,'POSICIONAMENTO'); headline(c,'O que não somos.',54,430,43,INK,600)
    no=['curso de educação financeira','aplicativo de mesada','banco infantil','lista de tarefas','escola online','marketplace de presentes','jogo de recompensas']
    card(c,54,110,398,250,'KONKI NÃO É','\n'.join(no),False,RED)
    card(c,508,110,398,250,'KONKI QUER SER','um sistema que transforma desejo em esforço verificável e desenvolvimento.\n\nNão começamos pelo conteúdo.\nComeçamos pelo objetivo.',True,GREEN)
    c.showPage()
    # 20
    page(c,20,True,'DIFERENCIAÇÃO'); headline(c,'Não basta ser “educação financeira\ngamificada para jovens”.',54,430,37,WHITE,820)
    txt(c,'Há produtos de educação financeira, mesada, tarefas, gamificação, objetivos e controle parental. A Tindin é um benchmark brasileiro já identificado.',54,320,13,Color(1,1,1,.58),maxw=820)
    chain=['OBJETIVO','CONTRATO','ESFORÇO VERIFICADO','PROGRESSO','CONQUISTA','HISTÓRICO']
    x=54
    for i,s in enumerate(chain):
        w=120 if i!=2 else 172; rect(c,x,185,w,64,Color(1,1,1,.07),Color(1,1,1,.13),14); txt(c,s,x+12,218,9,GREEN if i==2 else WHITE,BOLD,maxw=w-24)
        if i<len(chain)-1: txt(c,'+',x+w+10,210,16,GREEN,BOLD)
        x+=w+34
    txt(c,'Hipótese de diferenciação. Requer pesquisa competitiva e validação com usuários.',54,93,11,Color(1,1,1,.48)); c.showPage()
    # 21
    page(c,21,False,'HIPÓTESES DE MOAT'); headline(c,'Quatro vantagens que\npoderiam acumular valor.',54,425,38,INK,610)
    moats=[('01','PROOF OF EFFORT','verificação confiável de esforço'),('02','HISTÓRICO','registro longitudinal com valor acumulado'),('03','GOAL GRAPH','dados sobre objetivos, caminhos e progressão'),('04','MARCA','associação cultural com aprender a conquistar')]
    for i,(n,a,b) in enumerate(moats): card(c,54+(i%2)*426,245-(i//2)*125,398,100,n+'  '+a,b,i==0,GREEN)
    txt(c,'Ainda não possuímos moat. Estes são mecanismos potenciais a testar e construir.',54,77,12,MUTED); c.showPage()
    # 22
    page(c,22,True,'RED TEAM'); tag(c,'RISCO',54,456,'RISCO'); headline(c,'A empresa só existe se\nsobreviver a estes riscos.',54,410,37,WHITE,650)
    risks=['recompensa vira único motivo','pais gostam, mas não pagam','churn após a primeira conquista','IA facilita fraude','mentalidade transacional','responsável não cumpre','produto vira tarefa/escola','fintech cedo demais','desigualdade social visível','segurança de menores e LGPD','conteúdo não diferencia','verificação custa caro','produto escolhido pelos pais','objetivo distante desmotiva','concorrência conceitual forte']
    for i,s in enumerate(risks):
        x=54+(i%3)*286; y=293-(i//3)*46; txt(c,f'{i+1:02d}',x,y,9,RED,BOLD); txt(c,s,x+30,y,10,WHITE,FONT,maxw=230)
    c.showPage()
    # 23
    page(c,23,False,'O QUE PRECISAMOS PROVAR'); headline(c,'Antes de construir uma empresa,\nprecisamos provar um comportamento.',54,430,36,INK,800)
    hs=['Pais sentem o problema','Pais pagam','Jovens criam objetivos','Completam sem cobrança','Voltam semanalmente','Recompensa distante motiva','Proof of Effort escala','Pais percebem mudança','Criam segundo objetivo','Responsável continua pagando']
    for i,s in enumerate(hs):
        x=54+(i%2)*426; y=312-(i//2)*49; txt(c,f'H{i+1}',x,y,11,GREEN,BOLD); txt(c,s,x+45,y,11,INK,BOLD,maxw=340)
    rect(c,54,61,852,45,FOREST,None,14); txt(c,'H9 + H10 são fundamentais para retenção e LTV.',72,77,13,WHITE,BOLD); c.showPage()
    # 24
    page(c,24,True,'MVP'); headline(c,'Não precisamos começar\nconstruindo tudo isso.',54,425,40,WHITE,620)
    txt(c,'PRIMEIRO EXPERIMENTO',54,315,10,GREEN,BOLD); txt(c,'10 a 20 famílias  /  30 dias',54,278,25,WHITE,BOLD)
    tools=['WhatsApp','Tally / Forms','Notion','Sheets / Airtable','vídeo','áudio','protótipo atual']
    for i,s in enumerate(tools): rect(c,54+i*116,205,102,36,Color(1,1,1,.07),Color(1,1,1,.12),12); txt(c,s,66+i*116,218,9,WHITE,BOLD,maxw=78)
    txt(c,'Cada família: 1 objetivo  /  1 contrato  /  8 a 12 missões  /  provas  /  XP  /  progresso  /  relatório',54,150,13,Color(1,1,1,.62),maxw=820)
    headline(c,'Validar comportamento, não tecnologia.',54,88,20,GREEN,800); c.showPage()
    # 25
    page(c,25,False,'CRITÉRIOS PROPOSTOS'); headline(c,'Definir os critérios\nantes de ver o resultado.',54,425,38,INK,560)
    metrics=[('ACTIVATION','>80%'),('WEEK 2','>70%'),('WEEK 4','>60%'),('MISSÕES','>60%'),('SEM COBRANÇA','>30%'),('MUDANÇA PERCEBIDA','>70%'),('CONTINUAR PAGANDO','>50%'),('INDICAÇÕES','>30%'),('SEGUNDO OBJETIVO','>50%')]
    for i,(a,b) in enumerate(metrics):
        x=470+(i%3)*145; y=350-(i//3)*98; rect(c,x,y,126,80,WHITE,LINE,16); txt(c,b,x+14,y+41,22,FOREST,BOLD); txt(c,a,x+14,y+18,8,MUTED,BOLD,maxw=100)
    tag(c,'Não são benchmarks científicos',54,180,'ASSUNÇÃO'); txt(c,'Os números podem mudar com o aprendizado. O princípio é evitar redefinir sucesso depois do experimento.',54,135,13,MUTED,maxw=350); c.showPage()
    # 26
    page(c,26,True,'ROADMAP'); headline(c,'Tecnologia vem depois\ndo comportamento.',54,425,41,WHITE,640)
    phases=[('0 A 30 DIAS','10 a 20 famílias\nMVP manual\nvalidar loop'),('31 A 90 DIAS','50 a 100 famílias\npreço, idade, missões\nretenção e indicação'),('91 A 180 DIAS','SÓ SE RETENÇÃO FOR BOA\n200 a 500 famílias\ncreators, pilotos, automação')]
    for i,(a,b) in enumerate(phases): card(c,54+i*288,145,260,190,a,b,i==2,GREEN)
    c.showPage()
    # 27
    page(c,27,False,'VISÃO DE LONGO PRAZO'); headline(c,'E se aprender a conquistar\nvirasse uma habilidade?',54,430,39,INK,720)
    timeline=[('13','primeira conquista'),('14','primeiro dinheiro ganho'),('15','primeiro projeto'),('16','primeira experiência profissional'),('17','objetivo financeiro maior'),('18','cinco anos de histórico')]
    line(c,80,245,880,245,FOREST,3)
    for i,(age,s) in enumerate(timeline):
        x=80+i*160; c.setFillColor(GREEN); c.circle(x,245,9,fill=1,stroke=0); txt(c,age+' ANOS' if i==0 else age,x-20,286,10,FOREST,BOLD); txt(c,s,x-38,210,9,MUTED,BOLD,maxw=125)
    txt(c,'Começa com: “Eu quero um PS5.”',54,128,16,MUTED,BOLD); headline(c,'Pode terminar com: “Eu sei definir onde quero chegar e correr atrás.”',54,88,18,FOREST,840); c.showPage()
    # 28
    page(c,28,True,'A MARCA'); logo(c,54,414,True,1); jp_title(c,54,300); txt(c,'No japonês, konki está relacionado a perseverança, tenacidade e capacidade de continuar.',250,343,15,Color(1,1,1,.62),maxw=610)
    card(c,54,155,390,105,'JAPONÊS','perseverança',False,GREEN); card(c,516,155,390,105,'PORTUGUÊS','conquista, por associação sonora',True,GREEN)
    headline(c,'Perseverança é o processo.\nConquista é o resultado.',54,100,22,GREEN,780); txt(c,'Aprenda a conquistar.',700,64,12,WHITE,BOLD); c.showPage()
    # 29
    bg(c,INK); mark(c,54,434,40); headline(c,'“E se conseguirmos fazer um jovem querer se desenvolver porque ele finalmente entende para onde aquele esforço está levando?”',92,337,31,WHITE,770)
    logo(c,54,64,True,.82); txt(c,'29',886,24,8,Color(1,1,1,.35),BOLD); c.showPage()
    # 30
    page(c,30,False,'DISCUSSÃO ENTRE FUNDADORES'); headline(c,'O que precisamos\ndecidir juntos.',54,430,40,INK,570)
    qs=['Qual é o verdadeiro core?','Quem é o primeiro cliente?','Qual faixa etária?','Qual primeira conquista?','Quem define missões?','Como provamos esforço?','Quanto controle dos pais?','Quanta autonomia do jovem?','O que retém após a conquista?','Qual receita inicial?','O que não vamos construir?','Qual teste vai à rua em 2 semanas?']
    for i,s in enumerate(qs):
        x=430+(i%2)*238; y=392-(i//2)*50; txt(c,f'{i+1:02d}',x,y,9,GREEN,BOLD); txt(c,s,x+28,y,10,INK,BOLD,maxw=190)
    headline(c,'Não precisamos concordar com todas as respostas hoje.\nPrecisamos concordar sobre o que vamos testar.',54,122,18,FOREST,800)
    c.save()

if __name__=='__main__':
    OUT.parent.mkdir(parents=True,exist_ok=True)
    build(); print(OUT)
