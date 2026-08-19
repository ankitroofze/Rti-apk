import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// A3 portrait broadsheet proportions — scale to screen
const PAGE_WIDTH = SCREEN_WIDTH - 16;
const COL = (PAGE_WIDTH - 32) / 3; // 3-col grid with gutters
const GUTTER = 6;

// ─── Palette ───────────────────────────────────────────────────────────────
const C = {
  ink: '#0a0a0a',
  inkMid: '#2a2a2a',
  inkLight: '#4a4a4a',
  rule: '#222',
  ruleFaint: '#888',
  paper: '#f5f0e8',
  paperDark: '#ede8dc',
  placeholder: '#c8c2b4',
  placeholderBorder: '#555',
  white: '#fff',
};

// ─── Reusable primitives ────────────────────────────────────────────────────

const HRule = ({ thick, style }) => (
  <View style={[{ height: thick ? 2.5 : 0.8, backgroundColor: thick ? C.rule : C.ruleFaint, marginVertical: 2 }, style]} />
);

const VRule = () => (
  <View style={{ width: 0.8, backgroundColor: C.ruleFaint, marginHorizontal: GUTTER / 2 }} />
);

const LoremBlock = ({ lines = 6, size = 6.5, style }) => {
  const loremWords = [
    'समाचार', 'विशेष', 'रिपोर्ट', 'प्रमुख', 'घटना', 'स्थानीय', 'राष्ट्रीय',
    'सरकार', 'नीति', 'योजना', 'विकास', 'नागरिक', 'प्रशासन', 'अधिकारी',
    'बैठक', 'निर्णय', 'परियोजना', 'जानकारी', 'कार्यक्रम', 'आयोजन',
  ];
  const rows = Array.from({ length: lines }, (_, i) =>
    Array.from({ length: 7 }, (__, j) => loremWords[(i * 7 + j) % loremWords.length]).join(' ')
  );
  return (
    <View style={style}>
      {rows.map((r, i) => (
        <Text key={i} style={{ fontSize: size, color: C.inkLight, lineHeight: size * 1.55, fontFamily: 'serif' }}>{r}</Text>
      ))}
    </View>
  );
};

const Headline = ({ children, size = 14, caps, inverted, lines = 1, style }) => (
  <Text
    numberOfLines={lines}
    style={[
      {
        fontSize: size,
        fontWeight: '900',
        color: inverted ? C.white : C.ink,
        fontFamily: 'serif',
        textTransform: caps ? 'uppercase' : undefined,
        lineHeight: size * 1.2,
        letterSpacing: caps ? 0.5 : 0,
      },
      style,
    ]}
  >
    {children}
  </Text>
);

const SubHead = ({ children, size = 8, style }) => (
  <Text style={[{ fontSize: size, fontWeight: '700', color: C.inkMid, fontFamily: 'serif', lineHeight: size * 1.4 }, style]}>
    {children}
  </Text>
);

const Caption = ({ children, style }) => (
  <Text style={[{ fontSize: 5.5, color: C.inkLight, fontStyle: 'italic', lineHeight: 8 }, style]}>{children}</Text>
);

const ImagePlaceholder = ({ height = 70, label = 'छायाचित्र', style }) => (
  <View
    style={[
      {
        height,
        backgroundColor: C.placeholder,
        borderWidth: 0.8,
        borderColor: C.placeholderBorder,
        alignItems: 'center',
        justifyContent: 'center',
      },
      style,
    ]}
  >
    {/* diagonal cross hatch */}
    <View style={StyleSheet.absoluteFill}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: (height / 8) * i,
            left: 0,
            right: 0,
            height: 0.5,
            backgroundColor: C.placeholderBorder,
            opacity: 0.25,
          }}
        />
      ))}
    </View>
    <Text style={{ fontSize: 7, color: C.inkLight, fontStyle: 'italic' }}>{label}</Text>
  </View>
);

const NoticeBlock = ({ height = 90 }) => (
  <View style={{ height, borderWidth: 0.8, borderColor: C.rule, padding: 4, backgroundColor: C.paperDark }}>
    <View style={{ borderBottomWidth: 1, borderBottomColor: C.rule, marginBottom: 3, paddingBottom: 2 }}>
      <SubHead size={7}>● सूचना / जाहीरात</SubHead>
    </View>
    <LoremBlock lines={8} size={6} />
  </View>
);

// ─── HEADER ─────────────────────────────────────────────────────────────────
const Header = () => (
  <View style={{ backgroundColor: C.paper }}>
    {/* Top thin info strip */}
    <HRule thick />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 2, borderBottomWidth: 0.8, borderBottomColor: C.ruleFaint }}>
      <Text style={{ fontSize: 6, color: C.inkLight, fontFamily: 'serif' }}>बुधवार, १० जून २०२५ | वर्ष ४२ | अंक १५३</Text>
      <Text style={{ fontSize: 6, color: C.inkLight, fontFamily: 'serif' }}>मूल्य: ₹ ३.०० | पृष्ठ: १२</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 6, color: C.inkLight, fontFamily: 'serif' }}>www.prathamdarpan.com</Text>
        <View style={{ marginLeft: 6, borderWidth: 0.8, borderColor: C.rule, paddingHorizontal: 4, paddingVertical: 1 }}>
          <Text style={{ fontSize: 6, fontWeight: '800', color: C.ink }}>पृ. १</Text>
        </View>
      </View>
    </View>

    {/* Masthead badge */}
    <View style={{ alignItems: 'center', paddingVertical: 6, borderBottomWidth: 2.5, borderBottomColor: C.rule }}>
      {/* Decorative top rule pair */}
      <View style={{ flexDirection: 'row', width: '90%', marginBottom: 3 }}>
        <View style={{ flex: 1, height: 1.5, backgroundColor: C.rule, marginTop: 4 }} />
        <View style={{ marginHorizontal: 6 }}>
          <Text style={{ fontSize: 6, color: C.inkLight, letterSpacing: 3 }}>✦  ✦  ✦</Text>
        </View>
        <View style={{ flex: 1, height: 1.5, backgroundColor: C.rule, marginTop: 4 }} />
      </View>

      <Text
        style={{
          fontSize: 36,
          fontWeight: '900',
          color: C.ink,
          fontFamily: 'serif',
          letterSpacing: 2,
          textAlign: 'center',
        }}
      >
        प्रथम दर्पण
      </Text>
      <Text style={{ fontSize: 10, color: C.inkMid, letterSpacing: 4, fontFamily: 'serif', marginTop: 1 }}>
        PRATHAM DARPAN  •  प्रतिदिन  •  DAILY
      </Text>

      <View style={{ flexDirection: 'row', width: '90%', marginTop: 3 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: C.rule, marginTop: 4 }} />
        <View style={{ marginHorizontal: 6 }}>
          <Text style={{ fontSize: 6, color: C.inkLight, letterSpacing: 2 }}>नाशिक • पुणे • मुंबई • औरंगाबाद</Text>
        </View>
        <View style={{ flex: 1, height: 1, backgroundColor: C.rule, marginTop: 4 }} />
      </View>
    </View>
  </View>
);

// ─── THREE-COLUMN ROW ────────────────────────────────────────────────────────
const ThreeColRow = ({ left, center, right }) => (
  <View style={{ flexDirection: 'row', flex: 1 }}>
    <View style={{ flex: 1 }}>{left}</View>
    <VRule />
    <View style={{ flex: 1 }}>{center}</View>
    <VRule />
    <View style={{ flex: 1 }}>{right}</View>
  </View>
);

// ─── TOP SECTION ─────────────────────────────────────────────────────────────
const TopSection = () => (
  <View style={{ paddingTop: 6 }}>
    <ThreeColRow
      left={
        <View>
          <HRule thick />
          <Headline size={16} lines={3} style={{ marginBottom: 3 }}>
            {'महाराष्ट्रात मोठा\nराजकीय बदल;\nमुख्यमंत्री जाहीर'}
          </Headline>
          <HRule />
          <SubHead style={{ marginBottom: 3 }}>विशेष प्रतिनिधी, मुंबई</SubHead>
          <LoremBlock lines={14} />
          <HRule style={{ marginTop: 4 }} />
          <SubHead size={7} style={{ marginTop: 3 }}>► उपमुख्यमंत्र्यांचे वक्तव्य</SubHead>
          <LoremBlock lines={6} />
        </View>
      }
      center={
        <View>
          <HRule thick />
          <Headline size={13} lines={2} style={{ marginBottom: 3 }}>
            {'शेतकऱ्यांना मिळणार\nकर्जमाफी — घोषणा'}
          </Headline>
          <HRule />
          <ImagePlaceholder height={80} label="छायाचित्र" />
          <Caption style={{ marginTop: 2, marginBottom: 4 }}>
            ■ मंत्रालय, मुंबई — कर्जमाफी योजनेचे उद्घाटन प्रसंगी मंत्री व अधिकारी
          </Caption>
          <HRule />
          <LoremBlock lines={8} />
        </View>
      }
      right={
        <View>
          <HRule thick />
          <Headline size={13} lines={2} style={{ marginBottom: 3 }}>
            {'नाशिक जिल्ह्यात\nपाऊस सुरू; नदी दुथडी'}
          </Headline>
          <HRule />
          <ImagePlaceholder height={80} label="हवामान छायाचित्र" />
          <Caption style={{ marginTop: 2, marginBottom: 4 }}>
            ■ नाशिक — गोदावरी नदीला पूर आल्याने परिसरात सतर्कता जारी
          </Caption>
          <HRule />
          <LoremBlock lines={8} />
        </View>
      }
    />
  </View>
);

// ─── MIDDLE SECTION ──────────────────────────────────────────────────────────
const MiddleSection = () => (
  <View style={{ marginTop: 6 }}>
    <HRule thick />
    <ThreeColRow
      left={
        <View style={{ paddingTop: 4 }}>
          <SubHead size={7} style={{ marginBottom: 2 }}>● जाहीर सूचना</SubHead>
          <HRule />
          <NoticeBlock height={100} />
          <View style={{ marginTop: 5 }}>
            <SubHead size={7} style={{ marginBottom: 2 }}>राज्य बातम्या</SubHead>
            <HRule />
            <LoremBlock lines={10} />
          </View>
        </View>
      }
      center={
        <View style={{ paddingTop: 4 }}>
          {/* Black inverted headline strip */}
          <View style={{ backgroundColor: C.ink, paddingHorizontal: 5, paddingVertical: 4, marginBottom: 3 }}>
            <Headline size={15} inverted lines={2}>
              {'विधानसभेत गोंधळ;\nसभागृह तहकूब'}
            </Headline>
          </View>
          <HRule />
          <SubHead size={7} style={{ marginBottom: 3 }}>
            ■ विशेष वार्ताहर | पुणे
          </SubHead>
          <LoremBlock lines={6} />
          <HRule style={{ marginTop: 4 }} />
          <SubHead size={7} style={{ marginTop: 3, marginBottom: 2 }}>विपक्षाचा आरोप</SubHead>
          <LoremBlock lines={7} />
        </View>
      }
      right={
        <View style={{ paddingTop: 4 }}>
          <HRule />
          <Headline size={12} lines={2} style={{ marginBottom: 3 }}>
            {'क्रीडा: भारताचा\nविजय निश्चित'}
          </Headline>
          <HRule />
          <LoremBlock lines={8} />
          <HRule style={{ marginTop: 4 }} />
          <SubHead size={7} style={{ marginTop: 3, marginBottom: 2 }}>व्यापार वार्ता</SubHead>
          <LoremBlock lines={7} />
        </View>
      }
    />
  </View>
);

// ─── BOTTOM FEATURE SECTION ───────────────────────────────────────────────────
const BottomSection = () => (
  <View style={{ marginTop: 6 }}>
    <HRule thick />
    {/* Double rule accent */}
    <View style={{ height: 1, backgroundColor: C.rule, marginTop: 1, marginBottom: 4 }} />
    <View style={{ flexDirection: 'row' }}>
      {/* Feature article — 70% */}
      <View style={{ flex: 7, paddingRight: GUTTER }}>
        <SubHead size={7} caps style={{ letterSpacing: 2, marginBottom: 2, color: C.inkLight }}>
          ▌ आजचे विशेष
        </SubHead>
        <Headline size={22} lines={3} style={{ marginBottom: 4 }}>
          {'पुणे-मुंबई हायपरलूप:\nसरकारने दिली अधिकृत\nमंजुरी; काम सुरू होणार'}
        </Headline>
        <HRule />
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          {/* Sub-columns inside feature */}
          <View style={{ flex: 1, paddingRight: GUTTER }}>
            <LoremBlock lines={10} />
          </View>
          <VRule />
          <View style={{ flex: 1, paddingHorizontal: GUTTER }}>
            {/* Pull quote box */}
            <View style={{ borderLeftWidth: 3, borderLeftColor: C.ink, paddingLeft: 5, marginBottom: 6 }}>
              <SubHead size={8} style={{ lineHeight: 13 }}>
                {"\"हे प्रकल्प महाराष्ट्राच्या\nपुढील दशकाचे भाग्य\nबदलतील\" — मुख्यमंत्री"}
              </SubHead>
            </View>
            <LoremBlock lines={7} />
          </View>
          <VRule />
          <View style={{ flex: 1, paddingLeft: GUTTER }}>
            <LoremBlock lines={10} />
          </View>
        </View>
      </View>

      <VRule />

      {/* Supporting 30% column */}
      <View style={{ flex: 3, paddingLeft: GUTTER }}>
        <SubHead size={7} style={{ marginBottom: 2 }}>● संबंधित बातम्या</SubHead>
        <HRule />
        <Headline size={10} lines={2} style={{ marginTop: 3, marginBottom: 2 }}>
          {'रेल्वे विस्तार:\nनवे स्थानक जाहीर'}
        </Headline>
        <LoremBlock lines={6} />
        <HRule style={{ marginTop: 4 }} />
        <Headline size={10} lines={2} style={{ marginTop: 3, marginBottom: 2 }}>
          {'उद्योग क्षेत्र:\n२० हजार नोकऱ्या'}
        </Headline>
        <LoremBlock lines={6} />
        <HRule style={{ marginTop: 4 }} />
        <SubHead size={7} style={{ marginTop: 3 }}>■ परदेश वार्ता</SubHead>
        <LoremBlock lines={5} />
      </View>
    </View>
  </View>
);

// ─── FOOTER ──────────────────────────────────────────────────────────────────
const Footer = () => (
  <View style={{ marginTop: 8 }}>
    <HRule thick />
    {/* Legal info strip */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 0.8, borderBottomColor: C.ruleFaint }}>
      <Text style={{ fontSize: 5.5, color: C.inkLight }}>
        संपादक: रवींद्र देशमुख  |  मुद्रक व प्रकाशक: प्रथम प्रकाशन प्रा. लि.
      </Text>
      <Text style={{ fontSize: 5.5, color: C.inkLight }}>
        मुद्रणस्थळ: ४५, प्रेस इस्टेट, नाशिक - ४२२ ००१  |  RNI: MAHHIN/2001/09812
      </Text>
      <Text style={{ fontSize: 5.5, color: C.inkLight }}>
        © सर्व हक्क राखीव  |  ISSN 2348-1234
      </Text>
    </View>
    {/* Full-width slogan strip */}
    <View style={{ backgroundColor: C.ink, alignItems: 'center', paddingVertical: 5 }}>
      <Text style={{ fontSize: 9, color: C.white, letterSpacing: 5, fontFamily: 'serif', fontWeight: '700' }}>
        सत्य  •  निर्भय  •  निष्पक्ष  —  SATYA  •  NIRBHAY  •  NISHPAKSH
      </Text>
    </View>
  </View>
);

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function LayoutFourth() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.paper }}
      contentContainerStyle={{ padding: 8, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Outer page border */}
      <View style={{ borderWidth: 1.5, borderColor: C.rule, padding: 6, backgroundColor: C.paper }}>
        <Header />
        <TopSection />
        <MiddleSection />
        <BottomSection />
        <Footer />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({});