/* ==========================================================================
   souvenir.js — หน้า "ของที่ระลึก" + ระบบแอดมินเพิ่ม/แก้ไขสินค้า

   วิธีใช้: วางไฟล์นี้ไว้โฟลเดอร์เดียวกับ index.html แล้วเพิ่มบรรทัดนี้
   ต่อจากสคริปต์หลัก (หลัง </script> ตัวสุดท้าย และก่อน </body>):

       <script src="souvenir.js"></script>

   ไฟล์นี้จะสร้างเมนู "ของที่ระลึก", หน้าสินค้า และแท็บแอดมินให้เอง
   ข้อมูลสินค้าเก็บใน siteData.souvenirs จึงถูกบันทึกไปกับปุ่ม "บันทึกไปยัง GitHub" เดิม
   ========================================================================== */
(function () {
    'use strict';

    if (window.__souvenirLoaded) return;
    if (typeof siteData === 'undefined' || typeof translations === 'undefined') {
        console.error('souvenir.js: ต้องวาง <script src="souvenir.js"></script> ต่อจากสคริปต์หลักของ index.html');
        return;
    }
    window.__souvenirLoaded = true;

    const MAX_IMAGES = 8;      // จำนวนรูปสูงสุดต่อสินค้า
    const MAX_SIDE = 900;      // ย่อรูปที่อัปโหลดให้ด้านยาวไม่เกิน (px)
    const JPEG_QUALITY = 0.82;

    if (!Array.isArray(siteData.souvenirs)) siteData.souvenirs = [];

    /* ---------------------------------------------------------------- คำแปลตั้งต้นของสินค้า 9 รายการที่มีอยู่แล้ว
       เดิมสินค้ามีแต่ข้อมูลภาษาไทย (th) ทำให้เวลาลูกค้าเปลี่ยนภาษา ชื่อ/รายละเอียดสินค้าไม่เปลี่ยนตาม
       (ระบบเดิมได้แต่ fallback ไปอังกฤษแล้วไทย ซึ่งไม่มีอังกฤษอยู่ดี)
       ชุดนี้เติมคำแปลให้ครบทั้ง 9 ภาษาโดยอิงตำแหน่ง (index) ของสินค้าตอนโหลดครั้งแรก
       และจะเติมเฉพาะภาษาที่ "ยังไม่มีข้อมูล" เท่านั้น จึงไม่ทับสิ่งที่แอดมินเคยแก้ไขเองไว้ */
    const SEED_SOUVENIR_TRANSLATIONS = [
        { // 0: แก้วเก็บความเย็น Haunted Adventure ขนาด 20 ออนซ์ (แวมไพร์ ไม่มีคำว่า Vampire ในชื่อ)
            name: {
                en: "Haunted Adventure 20oz Tumbler",
                zh: "Haunted Adventure 20盎司保冷杯",
                ru: "Стакан-термос Haunted Adventure на 20 унций",
                hi: "Haunted Adventure 20 औंस टम्बलर",
                he: "כוס תרמית Haunted Adventure בנפח 20 אונקיות",
                ja: "Haunted Adventure 20オンス タンブラー",
                ko: "Haunted Adventure 20온스 텀블러",
                ar: "كوب حراري Haunted Adventure سعة 20 أونصة"
            },
            desc: {
                en: "The vampire in this haunted house is written into the lore as an ancient bloodsucking undead, dwelling inside a «dark coffin storeroom and mock graveyard». The Dormant One: the vampire's body lies still in its coffin as if in dormancy, waiting for the moment to hunt its prey, dressed in classic medieval European or ancient nobility attire.",
                zh: "这栋鬼屋中的吸血鬼被设定为一群古老的吸血不死族，栖息在«阴暗的棺材储藏室与模拟墓地»之中。沉睡者：吸血鬼的躯体静静躺在棺材里，仿佛正在沉睡蛰伏，等待猎食的时机降临，身着古典欧洲中世纪或古代贵族风格的服饰。",
                ru: "Вампир в этом доме с привидениями наделён легендой древнего кровососущего нежити, обитающего в «тёмном хранилище гробов и импровизированном кладбище». Спящий: тело вампира неподвижно лежит в гробу, словно в спячке, ожидая момента для охоты на добычу, одетое в классический средневековый европейский или древний аристократический наряд.",
                hi: "इस भूतिया घर में मौजूद वैम्पायर की पृष्ठभूमि एक प्राचीन रक्त-चूसने वाले अमर प्राणी के रूप में गढ़ी गई है, जो एक «अंधेरे ताबूत भंडार और नकली कब्रिस्तान» के भीतर निवास करता है। सुप्तावस्था में पड़ा प्राणी: वैम्पायर का शरीर ताबूत में शांत पड़ा रहता है मानो शिकार के इंतज़ार में सुप्तावस्था में हो, और वह क्लासिक मध्ययुगीन यूरोपीय या प्राचीन कुलीन वेशभूषा में सुसज्जित है।",
                he: "הערפד בבית הרפאים הזה נכתב לתוך העלילה כאחד המתים החיים העתיקים ששותים דם, השוכן בתוך «מחסן ארונות קבורה אפל ובית קברות מדומה». השוכב הרדום: גופו של הערפד שוכב דומם בארון הקבורה כאילו הוא בתרדמת, ממתין לרגע לצוד את טרפו, לבוש בתלבושת קלאסית מימי הביניים האירופיים או של אצולה עתיקה.",
                ja: "この幽霊屋敷に登場するヴァンパイアは、太古から血を吸う不死者として設定されており、«薄暗い棺の保管室と模擬墓地»の中に潜んでいます。眠れる者：ヴァンパイアの体は棺の中で静かに横たわり、まるで冬眠しているかのように獲物を狩る瞬間を待ち構えており、クラシックな中世ヨーロッパ風、あるいは古代貴族風の衣装をまとっています。",
                ko: "이 유령의 집에 등장하는 뱀파이어는 고대부터 피를 빨아온 불사의 존재로 설정되어 있으며, «어두운 관 보관실과 모의 묘지» 안에 거주하고 있습니다. 잠들어 있는 자: 뱀파이어의 몸은 마치 동면 중인 것처럼 관 속에 조용히 누워 사냥할 순간을 기다리고 있으며, 고전적인 중세 유럽풍 또는 고대 귀족풍 의상을 입고 있습니다.",
                ar: "تم تصميم خلفية مصاص الدماء في هذا المنزل المسكون ليكون من فصيلة الموتى الأحياء القدامى الذين يمتصون الدماء، ويقيم داخل «مستودع توابيت مظلم ومقبرة مصطنعة». الكائن النائم: يرقد جسد مصاص الدماء ساكناً داخل التابوت وكأنه في سبات، بانتظار لحظة اصطياد فريسته، مرتدياً زياً كلاسيكياً على الطراز الأوروبي في العصور الوسطى أو زي النبلاء القدامى."
            }
        },
        { // 1: แก้วเก็บความเย็น Vampire Haunted Adventure ขนาด 20 ออนซ์
            name: {
                en: "Vampire Haunted Adventure 20oz Tumbler",
                zh: "吸血鬼 Haunted Adventure 20盎司保冷杯",
                ru: "Стакан-термос Vampire Haunted Adventure на 20 унций",
                hi: "वैम्पायर Haunted Adventure 20 औंस टम्बलर",
                he: "כוס תרמית ערפד Haunted Adventure בנפח 20 אונקיות",
                ja: "ヴァンパイア Haunted Adventure 20オンス タンブラー",
                ko: "뱀파이어 Haunted Adventure 20온스 텀블러",
                ar: "كوب حراري مصاص دماء Haunted Adventure سعة 20 أونصة"
            },
            desc: {
                en: "The vampire in this haunted house is written into the lore as an ancient bloodsucking undead, dwelling inside a «dark coffin storeroom and mock graveyard». The Dormant One: the vampire's body lies still in its coffin as if in dormancy, waiting for the moment to hunt its prey, dressed in classic medieval European or ancient nobility attire.",
                zh: "这栋鬼屋中的吸血鬼被设定为一群古老的吸血不死族，栖息在«阴暗的棺材储藏室与模拟墓地»之中。沉睡者：吸血鬼的躯体静静躺在棺材里，仿佛正在沉睡蛰伏，等待猎食的时机降临，身着古典欧洲中世纪或古代贵族风格的服饰。",
                ru: "Вампир в этом доме с привидениями наделён легендой древнего кровососущего нежити, обитающего в «тёмном хранилище гробов и импровизированном кладбище». Спящий: тело вампира неподвижно лежит в гробу, словно в спячке, ожидая момента для охоты на добычу, одетое в классический средневековый европейский или древний аристократический наряд.",
                hi: "इस भूतिया घर में मौजूद वैम्पायर की पृष्ठभूमि एक प्राचीन रक्त-चूसने वाले अमर प्राणी के रूप में गढ़ी गई है, जो एक «अंधेरे ताबूत भंडार और नकली कब्रिस्तान» के भीतर निवास करता है। सुप्तावस्था में पड़ा प्राणी: वैम्पायर का शरीर ताबूत में शांत पड़ा रहता है मानो शिकार के इंतज़ार में सुप्तावस्था में हो, और वह क्लासिक मध्ययुगीन यूरोपीय या प्राचीन कुलीन वेशभूषा में सुसज्जित है।",
                he: "הערפד בבית הרפאים הזה נכתב לתוך העלילה כאחד המתים החיים העתיקים ששותים דם, השוכן בתוך «מחסן ארונות קבורה אפל ובית קברות מדומה». השוכב הרדום: גופו של הערפד שוכב דומם בארון הקבורה כאילו הוא בתרדמת, ממתין לרגע לצוד את טרפו, לבוש בתלבושת קלאסית מימי הביניים האירופיים או של אצולה עתיקה.",
                ja: "この幽霊屋敷に登場するヴァンパイアは、太古から血を吸う不死者として設定されており、«薄暗い棺の保管室と模擬墓地»の中に潜んでいます。眠れる者：ヴァンパイアの体は棺の中で静かに横たわり、まるで冬眠しているかのように獲物を狩る瞬間を待ち構えており、クラシックな中世ヨーロッパ風、あるいは古代貴族風の衣装をまとっています。",
                ko: "이 유령의 집에 등장하는 뱀파이어는 고대부터 피를 빨아온 불사의 존재로 설정되어 있으며, «어두운 관 보관실과 모의 묘지» 안에 거주하고 있습니다. 잠들어 있는 자: 뱀파이어의 몸은 마치 동면 중인 것처럼 관 속에 조용히 누워 사냥할 순간을 기다리고 있으며, 고전적인 중세 유럽풍 또는 고대 귀족풍 의상을 입고 있습니다.",
                ar: "تم تصميم خلفية مصاص الدماء في هذا المنزل المسكون ليكون من فصيلة الموتى الأحياء القدامى الذين يمتصون الدماء، ويقيم داخل «مستودع توابيت مظلم ومقبرة مصطنعة». الكائن النائم: يرقد جسد مصاص الدماء ساكناً داخل التابوت وكأنه في سبات، بانتظار لحظة اصطياد فريسته، مرتدياً زياً كلاسيكياً على الطراز الأوروبي في العصور الوسطى أو زي النبلاء القدامى."
            }
        },
        { // 2: แก้วเก็บความเย็น Doctor Haunted Adventure ขนาด 20 ออนซ์
            name: {
                en: "Doctor Haunted Adventure 20oz Tumbler",
                zh: "疯狂医生 Haunted Adventure 20盎司保冷杯",
                ru: "Стакан-термос Doctor Haunted Adventure на 20 унций",
                hi: "डॉक्टर Haunted Adventure 20 औंस टम्बलर",
                he: "כוס תרמית דוקטור Haunted Adventure בנפח 20 אונקיות",
                ja: "ドクター Haunted Adventure 20オンス タンブラー",
                ko: "닥터 Haunted Adventure 20온스 텀블러",
                ar: "كوب حراري الطبيب Haunted Adventure سعة 20 أونصة"
            },
            desc: {
                en: "The Deranged Human Experimenter: the mad doctor character is written into the backstory as a physician who lost his sanity and became obsessed with human experimentation. He secretly used this factory as a place to dissect corpses, perform organ-altering surgery, and secretly create «mutant creatures», resulting in a large number of victims.",
                zh: "变态的人体实验者：疯狂医生这个角色被设定为一位丧失理智、痴迷于人体实验的医生。他暗中利用这座工厂作为解剖尸体、进行器官改造手术并秘密制造«变异生物»的场所，导致大量受害者丧命。",
                ru: "Безумный экспериментатор над людьми: персонаж безумного доктора наделён предысторией врача, который потерял рассудок и стал одержим экспериментами над людьми. Он тайно использовал эту фабрику как место для вскрытия трупов, проведения операций по изменению органов и тайного создания «мутировавших существ», что привело к гибели множества жертв.",
                hi: "विकृत मानव प्रयोगकर्ता: पागल डॉक्टर के पात्र की पृष्ठभूमि एक ऐसे चिकित्सक के रूप में गढ़ी गई है जिसने अपना विवेक खो दिया और मानव प्रयोगों का दीवाना बन गया। उसने गुप्त रूप से इस फैक्ट्री का उपयोग शवों को चीरने, अंग-परिवर्तन शल्य चिकित्सा करने और गुप्त रूप से «उत्परिवर्तित जीव» बनाने के स्थान के रूप में किया, जिसके कारण बड़ी संख्या में पीड़ित मारे गए।",
                he: "החוקר האנושי המעוות: דמות הרופא המטורף נכתבה כרופא שאיבד את שפיותו והפך אובססיבי לניסויים בבני אדם. הוא ניצל בסתר את המפעל הזה כמקום לניתוח גופות, ביצוע ניתוחים לשינוי איברים, וליצירת «יצורים מוטנטים» בחשאי, מה שהוביל למותם של קורבנות רבים.",
                ja: "常軌を逸した人体実験者：狂気の医師というキャラクターは、正気を失い人体実験に取り憑かれた医師という設定になっています。彼はこの工場を密かに死体の解剖、臓器改造手術、そして«変異生物»の秘密の創造の場として利用し、多くの犠牲者を出しました。",
                ko: "변태적인 인체 실험자: 미친 의사 캐릭터는 이성을 잃고 인체 실험에 집착하게 된 의사라는 배경을 가지고 있습니다. 그는 이 공장을 몰래 시체 해부, 장기 개조 수술, 그리고 «돌연변이 생명체»를 비밀리에 만드는 장소로 사용했으며, 그로 인해 수많은 희생자가 발생했습니다.",
                ar: "الباحث البشري المنحرف: تم تصميم خلفية شخصية الطبيب المجنون ليكون طبيباً فقد عقله وأصبح مهووساً بالتجارب البشرية. استخدم هذا المصنع سراً كمكان لتشريح الجثث، وإجراء عمليات جراحية لتعديل الأعضاء، وخلق «كائنات متحولة» بشكل سري، مما أدى إلى سقوط عدد كبير من الضحايا."
            }
        },
        { // 3: แก้วเก็บความเย็น Doctor Haunted Adventure ขนาด 20 ออนซ์ (ซ้ำ)
            name: {
                en: "Doctor Haunted Adventure 20oz Tumbler",
                zh: "疯狂医生 Haunted Adventure 20盎司保冷杯",
                ru: "Стакан-термос Doctor Haunted Adventure на 20 унций",
                hi: "डॉक्टर Haunted Adventure 20 औंस टम्बलर",
                he: "כוס תרמית דוקטור Haunted Adventure בנפח 20 אונקיות",
                ja: "ドクター Haunted Adventure 20オンス タンブラー",
                ko: "닥터 Haunted Adventure 20온스 텀블러",
                ar: "كوب حراري الطبيب Haunted Adventure سعة 20 أونصة"
            },
            desc: {
                en: "The Deranged Human Experimenter: the mad doctor character is written into the backstory as a physician who lost his sanity and became obsessed with human experimentation. He secretly used this factory as a place to dissect corpses, perform organ-altering surgery, and secretly create «mutant creatures», resulting in a large number of victims.",
                zh: "变态的人体实验者：疯狂医生这个角色被设定为一位丧失理智、痴迷于人体实验的医生。他暗中利用这座工厂作为解剖尸体、进行器官改造手术并秘密制造«变异生物»的场所，导致大量受害者丧命。",
                ru: "Безумный экспериментатор над людьми: персонаж безумного доктора наделён предысторией врача, который потерял рассудок и стал одержим экспериментами над людьми. Он тайно использовал эту фабрику как место для вскрытия трупов, проведения операций по изменению органов и тайного создания «мутировавших существ», что привело к гибели множества жертв.",
                hi: "विकृत मानव प्रयोगकर्ता: पागल डॉक्टर के पात्र की पृष्ठभूमि एक ऐसे चिकित्सक के रूप में गढ़ी गई है जिसने अपना विवेक खो दिया और मानव प्रयोगों का दीवाना बन गया। उसने गुप्त रूप से इस फैक्ट्री का उपयोग शवों को चीरने, अंग-परिवर्तन शल्य चिकित्सा करने और गुप्त रूप से «उत्परिवर्तित जीव» बनाने के स्थान के रूप में किया, जिसके कारण बड़ी संख्या में पीड़ित मारे गए।",
                he: "החוקר האנושי המעוות: דמות הרופא המטורף נכתבה כרופא שאיבד את שפיותו והפך אובססיבי לניסויים בבני אדם. הוא ניצל בסתר את המפעל הזה כמקום לניתוח גופות, ביצוע ניתוחים לשינוי איברים, וליצירת «יצורים מוטנטים» בחשאי, מה שהוביל למותם של קורבנות רבים.",
                ja: "常軌を逸した人体実験者：狂気の医師というキャラクターは、正気を失い人体実験に取り憑かれた医師という設定になっています。彼はこの工場を密かに死体の解剖、臓器改造手術、そして«変異生物»の秘密の創造の場として利用し、多くの犠牲者を出しました。",
                ko: "변태적인 인체 실험자: 미친 의사 캐릭터는 이성을 잃고 인체 실험에 집착하게 된 의사라는 배경을 가지고 있습니다. 그는 이 공장을 몰래 시체 해부, 장기 개조 수술, 그리고 «돌연변이 생명체»를 비밀리에 만드는 장소로 사용했으며, 그로 인해 수많은 희생자가 발생했습니다.",
                ar: "الباحث البشري المنحرف: تم تصميم خلفية شخصية الطبيب المجنون ليكون طبيباً فقد عقله وأصبح مهووساً بالتجارب البشرية. استخدم هذا المصنع سراً كمكان لتشريح الجثث، وإجراء عمليات جراحية لتعديل الأعضاء، وخلق «كائنات متحولة» بشكل سري، مما أدى إلى سقوط عدد كبير من الضحايا."
            }
        },
        { // 4: แก้วเก็บความเย็น Chainsawman Haunted Adventure ขนาด 20 ออนซ์
            name: {
                en: "Chainsawman Haunted Adventure 20oz Tumbler",
                zh: "电锯狂人 Haunted Adventure 20盎司保冷杯",
                ru: "Стакан-термос Chainsawman Haunted Adventure на 20 унций",
                hi: "चेनसॉमैन Haunted Adventure 20 औंस टम्बलर",
                he: "כוס תרמית איש המסור Haunted Adventure בנפח 20 אונקיות",
                ja: "チェンソーマン Haunted Adventure 20オンス タンブラー",
                ko: "체인소맨 Haunted Adventure 20온스 텀블러",
                ar: "كوب حراري رجل المنشار Haunted Adventure سعة 20 أونصة"
            },
            desc: {
                en: "The Deranged Casket Factory Worker: according to the main storyline of Ripley's Haunted Adventure, set in an old casket-making factory, this character is one of the workers or carpenters who lost his sanity and became obsessed with hunting and killing people.",
                zh: "疯狂的棺材工厂工人：根据Ripley's Haunted Adventure的主线剧情，故事设定在一座古老的棺材制造工厂中，这个角色是其中一名丧失理智、痴迷于追杀猎人的工人或木匠。",
                ru: "Безумный рабочий фабрики гробов: согласно основной сюжетной линии Ripley's Haunted Adventure, действие которой разворачивается на старой фабрике по производству гробов, этот персонаж — один из рабочих или плотников, потерявших рассудок и одержимых охотой на людей и их убийством.",
                hi: "विकृत ताबूत फैक्ट्री कर्मचारी: Ripley's Haunted Adventure की मुख्य कहानी के अनुसार, जो एक पुरानी ताबूत बनाने वाली फैक्ट्री में स्थापित है, यह पात्र उन श्रमिकों या बढ़इयों में से एक है जिसने अपना विवेक खो दिया और लोगों का शिकार करने तथा उन्हें मारने का दीवाना बन गया।",
                he: "עובד מפעל ארונות הקבורה המעוות: על פי עלילת המסגרת המרכזית של Ripley's Haunted Adventure, המתרחשת במפעל ישן לייצור ארונות קבורה, דמות זו היא אחד העובדים או הנגרים שאיבד את שפיותו והפך אובססיבי לצוד ולהרוג אנשים.",
                ja: "常軌を逸した棺工場の労働者：古い棺製造工場を舞台にしたRipley's Haunted Adventureの本編ストーリーによると、このキャラクターは正気を失い、人を追い詰めて殺すことに取り憑かれた労働者、あるいは大工の一人です。",
                ko: "미쳐버린 관 공장 노동자: 오래된 관 제작 공장을 배경으로 한 Ripley's Haunted Adventure의 메인 스토리에 따르면, 이 캐릭터는 이성을 잃고 사람을 사냥하고 살해하는 데 집착하게 된 노동자 또는 목수 중 한 명입니다.",
                ar: "عامل مصنع التوابيت المنحرف: وفقاً للقصة الرئيسية لـ Ripley's Haunted Adventure التي تدور أحداثها في مصنع قديم لصناعة التوابيت، فإن هذه الشخصية هي أحد العمال أو النجارين الذين فقدوا عقولهم وأصبحوا مهووسين بمطاردة الناس وقتلهم."
            }
        },
        { // 5: แก้วเก็บความเย็น Gravediggers Haunted Adventure ขนาด 20 ออนซ์
            name: {
                en: "Gravediggers Haunted Adventure 20oz Tumbler",
                zh: "掘墓人 Haunted Adventure 20盎司保冷杯",
                ru: "Стакан-термос Gravediggers Haunted Adventure на 20 унций",
                hi: "ग्रेवडिगर्स Haunted Adventure 20 औंस टम्बलर",
                he: "כוס תרמית חופרי הקברים Haunted Adventure בנפח 20 אונקיות",
                ja: "グレイブディガー Haunted Adventure 20オンス タンブラー",
                ko: "그레이브디거 Haunted Adventure 20온스 텀블러",
                ar: "كوب حراري حفار القبور Haunted Adventure سعة 20 أونصة"
            },
            desc: {
                en: "Caretaker of the Grimsby Family Cemetery: set within the main storyline of the Grimsby & Streaper Casket Company, the Gravedigger character is written into the backstory as an old gravedigger who dug graves and tended the factory's private graveyard. Guide to Death: rather than being just an ordinary haunting spirit, he holds the role of «Gatekeeper», watching over and welcoming the living who wander in, before leading them onward to the dissection room and the horrifying corridors within.",
                zh: "格里姆斯比家族墓园的看守者：故事设定在格里姆斯比与斯特里珀棺材公司（Grimsby & Streaper Casket Company）的主线剧情中，掘墓人这个角色被设定为一位年迈的掘墓人，负责挖掘坟墓并看守工厂的私人墓地。通往死亡的引路人：他并非普通的徘徊亡魂，而是扮演着«看门人»（Gatekeeper）的角色，静静注视并迎接误入此地的活人，再将他们引向内部的解剖室与恐怖的走廊。",
                ru: "Смотритель семейного кладбища Гримсби: действие разворачивается в основной сюжетной линии компании по производству гробов Grimsby & Streaper, персонаж Могильщика наделён предысторией старого могильщика, который копал могилы и ухаживал за частным кладбищем фабрики. Проводник к смерти: вместо того чтобы быть просто обычным призраком, он играет роль «Привратника», наблюдая за живыми, забредшими сюда, и приветствуя их, прежде чем провести дальше — в комнату для вскрытия и по жутким коридорам внутри.",
                hi: "ग्रिम्सबी परिवार के कब्रिस्तान का रखवाला: ग्रिम्सबी एंड स्ट्रीपर कास्केट कंपनी (Grimsby & Streaper Casket Company) की मुख्य कहानी में स्थापित, ग्रेवडिगर पात्र की पृष्ठभूमि एक बूढ़े कब्र खोदने वाले के रूप में गढ़ी गई है जो कब्रें खोदता था और फैक्ट्री के निजी कब्रिस्तान की देखभाल करता था। मृत्यु की ओर मार्गदर्शक: एक साधारण भटकती आत्मा होने के बजाय, वह «द्वारपाल» (Gatekeeper) की भूमिका निभाता है, जो भटककर अंदर आने वाले जीवित लोगों पर नज़र रखता है और उनका स्वागत करता है, इससे पहले कि वह उन्हें अंदर के चीर-फाड़ कक्ष और भयावह गलियारों की ओर ले जाए।",
                he: "שומר בית הקברות של משפחת גרימסבי: במסגרת עלילת המסגרת המרכזית של חברת ארונות הקבורה גרימסבי ושטריפר (Grimsby & Streaper Casket Company), דמות חופר הקברים נכתבה כחופר קברים זקן שחפר קברים ותחזק את בית הקברות הפרטי של המפעל. מוביל אל המוות: במקום להיות רק רוח רפאים רגילה, הוא ממלא את תפקיד «שומר השער» (Gatekeeper), משגיח ומקבל בברכה את החיים שתועים פנימה, לפני שהוא מוביל אותם הלאה אל חדר הניתוחים ואל המסדרונות המבעיתים בפנים.",
                ja: "グリムズビー家墓地の管理人：グリムズビー・アンド・ストリーパー棺材会社（Grimsby & Streaper Casket Company）の本編ストーリーの中で、グレイブディガーというキャラクターは、墓を掘り工場の私設墓地を管理していた年老いた墓堀人という設定になっています。死への案内人：ただの徘徊する霊ではなく、彼は«門番»（Gatekeeper）としての役割を担い、迷い込んできた生者を見守り出迎えたのち、内部の解剖室や恐怖の廊下へと導いていきます。",
                ko: "그림스비 가문 묘지의 관리인: 그림스비 앤 스트리퍼 관 회사(Grimsby & Streaper Casket Company)의 메인 스토리를 배경으로, 그레이브디거 캐릭터는 무덤을 파고 공장의 개인 묘지를 관리하던 늙은 무덤 파는 사람이라는 배경을 가지고 있습니다. 죽음으로의 안내자: 그는 단순히 떠도는 영혼이 아니라 «문지기»(Gatekeeper) 역할을 맡아, 길을 잃고 들어온 산 사람들을 지켜보고 맞이한 후, 내부의 해부실과 공포스러운 복도로 안내합니다.",
                ar: "حارس مقبرة عائلة غريمسبي: ضمن القصة الرئيسية لشركة غريمسبي وستريبر لصناعة التوابيت (Grimsby & Streaper Casket Company)، تم تصميم خلفية شخصية حفار القبور ليكون حفار قبور عجوزاً كان يحفر القبور ويعتني بالمقبرة الخاصة بالمصنع. مرشد إلى الموت: بدلاً من أن يكون مجرد شبح عادي يطارد الأماكن، فإنه يتولى دور «حارس البوابة» (Gatekeeper) الذي يراقب ويرحب بالأحياء الذين يتوهون إلى الداخل، قبل أن يقودهم إلى غرفة التشريح والممرات المرعبة بالداخل."
            }
        },
        { // 6: แก้วเก็บความเย็น Gravediggers Haunted Adventure ขนาด 20 ออนซ์ (ซ้ำ)
            name: {
                en: "Gravediggers Haunted Adventure 20oz Tumbler",
                zh: "掘墓人 Haunted Adventure 20盎司保冷杯",
                ru: "Стакан-термос Gravediggers Haunted Adventure на 20 унций",
                hi: "ग्रेवडिगर्स Haunted Adventure 20 औंस टम्बलर",
                he: "כוס תרמית חופרי הקברים Haunted Adventure בנפח 20 אונקיות",
                ja: "グレイブディガー Haunted Adventure 20オンス タンブラー",
                ko: "그레이브디거 Haunted Adventure 20온스 텀블러",
                ar: "كوب حراري حفار القبور Haunted Adventure سعة 20 أونصة"
            },
            desc: {
                en: "Caretaker of the Grimsby Family Cemetery: set within the main storyline of the Grimsby & Streaper Casket Company, the Gravedigger character is written into the backstory as an old gravedigger who dug graves and tended the factory's private graveyard. Guide to Death: rather than being just an ordinary haunting spirit, he holds the role of «Gatekeeper», watching over and welcoming the living who wander in, before leading them onward to the dissection room and the horrifying corridors within.",
                zh: "格里姆斯比家族墓园的看守者：故事设定在格里姆斯比与斯特里珀棺材公司（Grimsby & Streaper Casket Company）的主线剧情中，掘墓人这个角色被设定为一位年迈的掘墓人，负责挖掘坟墓并看守工厂的私人墓地。通往死亡的引路人：他并非普通的徘徊亡魂，而是扮演着«看门人»（Gatekeeper）的角色，静静注视并迎接误入此地的活人，再将他们引向内部的解剖室与恐怖的走廊。",
                ru: "Смотритель семейного кладбища Гримсби: действие разворачивается в основной сюжетной линии компании по производству гробов Grimsby & Streaper, персонаж Могильщика наделён предысторией старого могильщика, который копал могилы и ухаживал за частным кладбищем фабрики. Проводник к смерти: вместо того чтобы быть просто обычным призраком, он играет роль «Привратника», наблюдая за живыми, забредшими сюда, и приветствуя их, прежде чем провести дальше — в комнату для вскрытия и по жутким коридорам внутри.",
                hi: "ग्रिम्सबी परिवार के कब्रिस्तान का रखवाला: ग्रिम्सबी एंड स्ट्रीपर कास्केट कंपनी (Grimsby & Streaper Casket Company) की मुख्य कहानी में स्थापित, ग्रेवडिगर पात्र की पृष्ठभूमि एक बूढ़े कब्र खोदने वाले के रूप में गढ़ी गई है जो कब्रें खोदता था और फैक्ट्री के निजी कब्रिस्तान की देखभाल करता था। मृत्यु की ओर मार्गदर्शक: एक साधारण भटकती आत्मा होने के बजाय, वह «द्वारपाल» (Gatekeeper) की भूमिका निभाता है, जो भटककर अंदर आने वाले जीवित लोगों पर नज़र रखता है और उनका स्वागत करता है, इससे पहले कि वह उन्हें अंदर के चीर-फाड़ कक्ष और भयावह गलियारों की ओर ले जाए।",
                he: "שומר בית הקברות של משפחת גרימסבי: במסגרת עלילת המסגרת המרכזית של חברת ארונות הקבורה גרימסבי ושטריפר (Grimsby & Streaper Casket Company), דמות חופר הקברים נכתבה כחופר קברים זקן שחפר קברים ותחזק את בית הקברות הפרטי של המפעל. מוביל אל המוות: במקום להיות רק רוח רפאים רגילה, הוא ממלא את תפקיד «שומר השער» (Gatekeeper), משגיח ומקבל בברכה את החיים שתועים פנימה, לפני שהוא מוביל אותם הלאה אל חדר הניתוחים ואל המסדרונות המבעיתים בפנים.",
                ja: "グリムズビー家墓地の管理人：グリムズビー・アンド・ストリーパー棺材会社（Grimsby & Streaper Casket Company）の本編ストーリーの中で、グレイブディガーというキャラクターは、墓を掘り工場の私設墓地を管理していた年老いた墓堀人という設定になっています。死への案内人：ただの徘徊する霊ではなく、彼は«門番»（Gatekeeper）としての役割を担い、迷い込んできた生者を見守り出迎えたのち、内部の解剖室や恐怖の廊下へと導いていきます。",
                ko: "그림스비 가문 묘지의 관리인: 그림스비 앤 스트리퍼 관 회사(Grimsby & Streaper Casket Company)의 메인 스토리를 배경으로, 그레이브디거 캐릭터는 무덤을 파고 공장의 개인 묘지를 관리하던 늙은 무덤 파는 사람이라는 배경을 가지고 있습니다. 죽음으로의 안내자: 그는 단순히 떠도는 영혼이 아니라 «문지기»(Gatekeeper) 역할을 맡아, 길을 잃고 들어온 산 사람들을 지켜보고 맞이한 후, 내부의 해부실과 공포스러운 복도로 안내합니다.",
                ar: "حارس مقبرة عائلة غريمسبي: ضمن القصة الرئيسية لشركة غريمسبي وستريبر لصناعة التوابيت (Grimsby & Streaper Casket Company)، تم تصميم خلفية شخصية حفار القبور ليكون حفار قبور عجوزاً كان يحفر القبور ويعتني بالمقبرة الخاصة بالمصنع. مرشد إلى الموت: بدلاً من أن يكون مجرد شبح عادي يطارد الأماكن، فإنه يتولى دور «حارس البوابة» (Gatekeeper) الذي يراقب ويرحب بالأحياء الذين يتوهون إلى الداخل، قبل أن يقودهم إلى غرفة التشريح والممرات المرعبة بالداخل."
            }
        },
        { // 7: แพ็กเกจภาพถ่ายที่ระลึก 250 บาท
            name: {
                en: "Ripley's Haunted Adventure Souvenir Photo Package - 250 Baht",
                zh: "Ripley's Haunted Adventure 纪念照片套餐 - 250泰铢",
                ru: "Памятный фотопакет Ripley's Haunted Adventure — 250 бат",
                hi: "Ripley's Haunted Adventure स्मृति फोटो पैकेज - 250 बात",
                he: "חבילת תמונות מזכרת של Ripley's Haunted Adventure - 250 באט",
                ja: "Ripley's Haunted Adventure 記念写真パッケージ - 250バーツ",
                ko: "Ripley's Haunted Adventure 기념 사진 패키지 - 250바트",
                ar: "باقة صور تذكارية من Ripley's Haunted Adventure - 250 بات"
            },
            desc: {
                en: "1 printed photo\n2 digital photo files",
                zh: "实体照片 1张\n数码照片文件 2个",
                ru: "1 напечатанное фото\n2 цифровых файла фото",
                hi: "1 प्रिंटेड फोटो\n2 डिजिटल फोटो फाइलें",
                he: "תמונה מודפסת אחת\n2 קבצי תמונה דיגיטליים",
                ja: "プリント写真 1枚\nデジタル写真データ 2ファイル",
                ko: "인화 사진 1장\n디지털 사진 파일 2개",
                ar: "صورة مطبوعة واحدة\nملفان رقميان للصور"
            }
        },
        { // 8: แพ็กเกจภาพถ่ายที่ระลึก 380 บาท
            name: {
                en: "Ripley's Haunted Adventure Souvenir Photo Package - 380 Baht",
                zh: "Ripley's Haunted Adventure 纪念照片套餐 - 380泰铢",
                ru: "Памятный фотопакет Ripley's Haunted Adventure — 380 бат",
                hi: "Ripley's Haunted Adventure स्मृति फोटो पैकेज - 380 बात",
                he: "חבילת תמונות מזכרת של Ripley's Haunted Adventure - 380 באט",
                ja: "Ripley's Haunted Adventure 記念写真パッケージ - 380バーツ",
                ko: "Ripley's Haunted Adventure 기념 사진 패키지 - 380바트",
                ar: "باقة صور تذكارية من Ripley's Haunted Adventure - 380 بات"
            },
            desc: {
                en: "3 printed photos\n3 digital photo files",
                zh: "实体照片 3张\n数码照片文件 3个",
                ru: "3 напечатанных фото\n3 цифровых файла фото",
                hi: "3 प्रिंटेड फोटो\n3 डिजिटल फोटो फाइलें",
                he: "3 תמונות מודפסות\n3 קבצי תמונה דיגיטליים",
                ja: "プリント写真 3枚\nデジタル写真データ 3ファイル",
                ko: "인화 사진 3장\n디지털 사진 파일 3개",
                ar: "3 صور مطبوعة\n3 ملفات صور رقمية"
            }
        }
    ];

    // เติมคำแปลให้สินค้าที่มีอยู่แล้ว โดยจับคู่ตามตำแหน่ง (index) และเติมเฉพาะภาษาที่ยังว่างอยู่เท่านั้น
    // ปลอดภัยต่อการรันซ้ำทุกครั้งที่โหลดหน้าเว็บ (idempotent) และจะไม่ทับข้อมูลที่แอดมินแก้ไขเองไว้แล้ว
    function seedSouvenirTranslations() {
        siteData.souvenirs.forEach((p, i) => {
            const seed = SEED_SOUVENIR_TRANSLATIONS[i];
            if (!seed) return;
            ['name', 'desc'].forEach(field => {
                if (!p[field] || typeof p[field] !== 'object') p[field] = {};
                Object.keys(seed[field]).forEach(lang => {
                    if (!p[field][lang]) p[field][lang] = seed[field][lang];
                });
            });
        });
    }
    seedSouvenirTranslations();

    /* ---------------------------------------------------------------- ข้อความหลายภาษา */
    const TEXT = {
        th: { nav_souvenir: 'ของที่ระลึก', souvenir_title: 'ของที่ระลึก', souvenir_sub: "สินค้าที่ระลึกจาก Ripley's Believe It or Not! Pattaya", souvenir_empty: 'สินค้ากำลังจะมาเร็วๆ นี้', souvenir_soldout: 'สินค้าหมด' },
        en: { nav_souvenir: 'Souvenirs', souvenir_title: 'Souvenir Shop', souvenir_sub: "Souvenirs from Ripley's Believe It or Not! Pattaya", souvenir_empty: 'Coming soon', souvenir_soldout: 'Sold out' },
        zh: { nav_souvenir: '纪念品', souvenir_title: '纪念品商店', souvenir_sub: "Ripley's Believe It or Not! 芭堤雅纪念品", souvenir_empty: '敬请期待', souvenir_soldout: '已售罄' },
        ru: { nav_souvenir: 'Сувениры', souvenir_title: 'Магазин сувениров', souvenir_sub: "Сувениры из Ripley's Believe It or Not! Pattaya", souvenir_empty: 'Скоро в продаже', souvenir_soldout: 'Нет в наличии' },
        hi: { nav_souvenir: 'यादगार वस्तुएँ', souvenir_title: 'स्मृति चिन्ह की दुकान', souvenir_sub: "Ripley's Believe It or Not! Pattaya के स्मृति चिन्ह", souvenir_empty: 'जल्द आ रहा है', souvenir_soldout: 'स्टॉक में नहीं' },
        he: { nav_souvenir: 'מזכרות', souvenir_title: 'חנות מזכרות', souvenir_sub: "מזכרות מ-Ripley's Believe It or Not! Pattaya", souvenir_empty: 'בקרוב', souvenir_soldout: 'אזל מהמלאי' },
        ja: { nav_souvenir: 'お土産', souvenir_title: 'お土産ショップ', souvenir_sub: "Ripley's Believe It or Not! パタヤのお土産", souvenir_empty: '近日登場', souvenir_soldout: '売り切れ' },
        ko: { nav_souvenir: '기념품', souvenir_title: '기념품 숍', souvenir_sub: "Ripley's Believe It or Not! 파타야 기념품", souvenir_empty: '곧 만나보실 수 있습니다', souvenir_soldout: '품절' },
        ar: { nav_souvenir: 'الهدايا التذكارية', souvenir_title: 'متجر الهدايا التذكارية', souvenir_sub: "هدايا تذكارية من Ripley's Believe It or Not! Pattaya", souvenir_empty: 'قريبًا', souvenir_soldout: 'نفدت الكمية' }
    };
    Object.keys(TEXT).forEach(l => {
        translations[l] = translations[l] || {};
        Object.assign(translations[l], TEXT[l]);
    });

    /* ---------------------------------------------------------------- ตัวช่วย */
    const T = () => translations[currentLang] || translations.en || {};
    const esc = s => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    // ชื่อ/รายละเอียดเก็บแยกตามภาษา: p.name = { th, en, ... } ถ้าภาษานั้นว่างให้ใช้อังกฤษ แล้วไทย
    const text = (p, field, lang) => {
        const o = p[field] || {};
        const l = lang || currentLang;
        return o[l] || o.en || o.th || '';
    };
    const priceText = p => {
        const n = Number(p.price);
        return n > 0 ? n.toLocaleString() : '';
    };
    const editorVisible = () => {
        const el = document.getElementById('adminTabSouvenir');
        return !!el && el.style.display !== 'none';
    };

    /* ---------------------------------------------------------------- CSS */
    const css = `
        .sv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 24px; margin-top: 30px; }
        .sv-card { position: relative; background: #fff; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border-top: 5px solid var(--primary); cursor: pointer; transition: 0.3s; }
        .sv-card:hover { transform: translateY(-8px); box-shadow: 0 15px 40px rgba(0,0,0,0.5); }
        .sv-img { position: relative; aspect-ratio: 1 / 1; background: #f0f0f0; }
        .sv-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .sv-noimg { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 3em; }
        .sv-price { position: absolute; bottom: 0; right: 12px; transform: translateY(50%); background: var(--primary); color: #fff; padding: 6px 16px; border-radius: 22px; font-size: 1.1em; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.35); border: 2px solid #fff; z-index: 2; white-space: nowrap; }
        .sv-soldout { position: absolute; inset: 0; background: rgba(0,0,0,0.55); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.3em; font-weight: bold; text-align: center; padding: 10px; }
        .sv-info { padding: 28px 16px 18px; }
        .sv-info h4 { font-size: 1.1em; color: var(--dark); line-height: 1.4; }
        [dir="rtl"] .sv-price { right: auto; left: 12px; }
        .sv-main { width: 100%; max-height: 420px; object-fit: contain; background: #f8f9fa; border-radius: 10px; margin-bottom: 10px; display: block; }
        .sv-thumbs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px; }
        .sv-thumbs img { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; border: 2px solid #eee; cursor: pointer; }
        .sv-thumbs img.active { border-color: var(--primary); }
        .sv-edit-item { background: #fff; border: 1px solid #ddd; border-radius: 10px; padding: 15px; margin-bottom: 15px; }
        .sv-edit-item h4 { margin-bottom: 12px; color: var(--dark); }
        .sv-check { display: inline-flex; align-items: center; gap: 8px; margin: 5px 0 10px; font-weight: bold; color: var(--dark); cursor: pointer; }
        .sv-check input { width: 18px; height: 18px; accent-color: var(--primary); }
        .sv-edit-imgs { display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0; }
        .sv-edit-img { position: relative; }
        .sv-edit-img img { width: 90px; height: 90px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd; display: block; }
        .sv-edit-img button { position: absolute; top: -6px; right: -6px; width: 22px; height: 22px; border-radius: 50%; border: none; background: #e74c3c; color: #fff; cursor: pointer; line-height: 1; }
        .sv-edit-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 8px; }
        .sv-edit-row .sv-url { flex: 1; min-width: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .sv-edit-actions { margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 10px; }
        @media (max-width: 768px) {
            .sv-grid { grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 20px; }
            .sv-info { padding: 24px 10px 12px; }
            .sv-info h4 { font-size: 0.95em; }
            .sv-price { font-size: 0.95em; padding: 4px 12px; }
        }
    `;
    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    /* ---------------------------------------------------------------- สร้างเมนู / หน้า / แท็บแอดมิน */
    function inject(anchor, position, html, label) {
        if (!anchor) { console.warn('souvenir.js: ไม่พบตำแหน่งสำหรับ ' + label); return; }
        anchor.insertAdjacentHTML(position, html);
    }

    inject(
        document.querySelector('#navContainer button[onclick*="showSection(\'contact\')"]'),
        'beforebegin',
        `<button class="nav-btn" onclick="showSection('souvenir')">
            <i class="fas fa-bag-shopping"></i> <span data-i18n="nav_souvenir">ของที่ระลึก</span>
        </button>`,
        'ปุ่มเมนู'
    );

    inject(
        document.getElementById('contact'),
        'beforebegin',
        `<section id="souvenir" class="section">
            <div class="hero">
                <h1 data-i18n="souvenir_title">ของที่ระลึก</h1>
                <p data-i18n="souvenir_sub">สินค้าที่ระลึกจาก Ripley's Believe It or Not! Pattaya</p>
            </div>
            <div class="sv-grid" id="souvenirGrid"></div>
        </section>`,
        'หน้าของที่ระลึก'
    );

    inject(
        document.querySelector('#adminDashboard .tabs'),
        'beforeend',
        `<button class="tab" onclick="showAdminTab('souvenir')">🛍️ ของที่ระลึก</button>`,
        'แท็บแอดมิน'
    );

    inject(
        document.getElementById('adminTabContent'),
        'beforebegin',
        `<div id="adminTabSouvenir" class="admin-section" style="display:none;">
            <h3><i class="fas fa-bag-shopping"></i> จัดการของที่ระลึก</h3>
            <div id="souvenirLangNote" class="lang-editing-note"></div>
            <div id="souvenirEditor"></div>
            <button class="btn btn-success" onclick="addSouvenir()"><i class="fas fa-plus"></i> เพิ่มสินค้าใหม่</button>
            <button class="btn" onclick="saveAllChanges()" style="margin-top: 20px;">
                <i class="fas fa-save"></i> บันทึกการเปลี่ยนแปลงทั้งหมดไปยัง GitHub
            </button>
        </div>`,
        'ส่วนจัดการสินค้าในแอดมิน'
    );

    /* ---------------------------------------------------------------- หน้าลูกค้า */
    function renderSouvenirs() {
        const grid = document.getElementById('souvenirGrid');
        if (!grid) return;
        const t = T();
        const list = siteData.souvenirs || [];
        if (!list.length) {
            grid.innerHTML = `<div class="info-box" style="grid-column: 1 / -1; text-align: center; margin-bottom: 0;">${t.souvenir_empty || ''}</div>`;
            return;
        }
        grid.innerHTML = list.map((p, i) => {
            const img = (p.images || [])[0];
            const name = esc(text(p, 'name'));
            const price = priceText(p);
            return `
                <div class="sv-card" onclick="openSouvenir(${i})" role="button">
                    <div class="sv-img">
                        ${img ? `<img src="${esc(img)}" alt="${name}" loading="lazy">` : `<div class="sv-noimg"><i class="fas fa-gift"></i></div>`}
                        ${p.soldOut ? `<div class="sv-soldout">${t.souvenir_soldout || ''}</div>` : ''}
                        ${price ? `<div class="sv-price">${price} ${t.baht || 'Baht'}</div>` : ''}
                    </div>
                    <div class="sv-info"><h4>${name}</h4></div>
                </div>`;
        }).join('');
    }

    function openSouvenir(i) {
        const p = (siteData.souvenirs || [])[i];
        if (!p) return;
        const t = T();
        const imgs = p.images || [];
        const name = esc(text(p, 'name'));
        const desc = esc(text(p, 'desc')).replace(/\n/g, '<br>');
        const price = priceText(p);
        document.getElementById('modalContent').innerHTML = `
            ${imgs.length ? `<img id="svMainImg" class="sv-main" src="${esc(imgs[0])}" alt="${name}">` : ''}
            ${imgs.length > 1 ? `<div class="sv-thumbs">${imgs.map((src, k) => `<img src="${esc(src)}" class="${k === 0 ? 'active' : ''}" onclick="svShowImg(${i}, ${k})" alt="">`).join('')}</div>` : ''}
            <h2>${name}</h2>
            ${price ? `<div class="modal-price">${price} ${t.baht || 'Baht'}</div>` : ''}
            ${p.soldOut ? `<div class="modal-price" style="background:#777;">${t.souvenir_soldout || ''}</div>` : ''}
            ${desc ? `<p>${desc}</p>` : ''}`;
        document.getElementById('attractionModal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function svShowImg(i, k) {
        const p = (siteData.souvenirs || [])[i];
        const main = document.getElementById('svMainImg');
        if (!p || !main || !p.images || !p.images[k]) return;
        main.src = p.images[k];
        document.querySelectorAll('.sv-thumbs img').forEach((el, idx) => el.classList.toggle('active', idx === k));
    }

    /* ---------------------------------------------------------------- แอดมิน: ตัวแก้ไขสินค้า */
    const LANG_NAMES = { th: 'ไทย', en: 'English', zh: '中文', ru: 'Русский', hi: 'हिन्दी', he: 'עברית', ja: '日本語', ko: '한국어', ar: 'العربية' };

    function refresh(editorToo) {
        renderSouvenirs();
        if (editorToo) renderSouvenirEditor();
    }

    // หมายเหตุ: ช่องในตัวแก้ไขไม่ใช้ class "admin-section" เพราะฟังก์ชัน showAdminTab เดิมจะซ่อนทุกอันที่ใช้ class นี้
    function renderSouvenirEditor() {
        const box = document.getElementById('souvenirEditor');
        if (!box) return;
        const list = siteData.souvenirs;
        const note = document.getElementById('souvenirLangNote');
        if (note) {
            note.innerHTML = `<i class="fas fa-language"></i> กำลังแก้ไขชื่อ/รายละเอียดของภาษา: <strong>${LANG_NAMES[currentLang] || currentLang}</strong>` +
                `<br>ช่องที่เว้นว่างไว้ ระบบจะแสดงข้อความภาษาอังกฤษ (ถ้าไม่มีใช้ภาษาไทย) แทน — สลับภาษาที่มุมขวาบนเพื่อแก้ไขภาษาอื่น` +
                `<br><i class="fas fa-photo-video"></i> ราคา / รูปภาพ / สถานะสินค้าหมด ใช้ร่วมกันทุกภาษา`;
        }
        if (!list.length) {
            box.innerHTML = '<p style="margin-bottom:15px;color:#666;">ยังไม่มีสินค้า กดปุ่ม "เพิ่มสินค้าใหม่" เพื่อเริ่มต้น</p>';
            return;
        }
        box.innerHTML = list.map((p, i) => `
            <div class="sv-edit-item">
                <h4>${i + 1}. ${esc(text(p, 'name')) || '(ยังไม่มีชื่อ)'}</h4>
                <div class="form-group">
                    <label>ชื่อสินค้า (${LANG_NAMES[currentLang] || currentLang})</label>
                    <input type="text" value="${esc((p.name || {})[currentLang] || '')}" placeholder="${esc(text(p, 'name'))}" onchange="svUpdateText(${i}, 'name', this.value)">
                </div>
                <div class="form-group">
                    <label>รายละเอียด (${LANG_NAMES[currentLang] || currentLang})</label>
                    <textarea placeholder="${esc(text(p, 'desc'))}" onchange="svUpdateText(${i}, 'desc', this.value)">${esc((p.desc || {})[currentLang] || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>ราคา (บาท)</label>
                    <input type="number" min="0" step="1" value="${p.price == null ? '' : esc(p.price)}" onchange="svUpdatePrice(${i}, this.value)">
                </div>
                <label class="sv-check"><input type="checkbox" ${p.soldOut ? 'checked' : ''} onchange="svToggleSold(${i}, this.checked)"> สินค้าหมด (แสดงป้าย "สินค้าหมด" บนการ์ด)</label>
                <div>
                    <strong>รูปภาพ (${(p.images || []).length}/${MAX_IMAGES}) — รูปแรกคือรูปหน้าปก</strong>
                    <div class="sv-edit-imgs">
                        ${(p.images || []).map((src, k) => `
                            <div class="sv-edit-img">
                                <img src="${esc(src)}" alt="">
                                <button type="button" title="ลบรูปนี้" onclick="svRemoveImage(${i}, ${k})">✕</button>
                            </div>`).join('')}
                    </div>
                    <div class="sv-edit-row">
                        <label class="btn btn-secondary" style="display:inline-block;cursor:pointer;margin:0;">
                            <i class="fas fa-upload"></i> อัปโหลดรูป
                            <input type="file" accept="image/*" multiple hidden onchange="svUploadImages(${i}, this)">
                        </label>
                        <input type="text" class="sv-url" id="svUrl${i}" placeholder="หรือวางลิงก์รูป https://...">
                        <button type="button" class="btn" style="margin:0;" onclick="svAddImageUrl(${i})">เพิ่มจากลิงก์</button>
                    </div>
                </div>
                <div class="sv-edit-actions">
                    <button type="button" class="btn" onclick="svMove(${i}, -1)" ${i === 0 ? 'disabled' : ''}>↑ เลื่อนขึ้น</button>
                    <button type="button" class="btn" onclick="svMove(${i}, 1)" ${i === list.length - 1 ? 'disabled' : ''}>↓ เลื่อนลง</button>
                    <button type="button" class="btn btn-danger" onclick="deleteSouvenir(${i})"><i class="fas fa-trash"></i> ลบสินค้า</button>
                </div>
            </div>`).join('');
    }

    function addSouvenir() {
        siteData.souvenirs.push({ name: { th: 'สินค้าใหม่' }, desc: {}, price: 0, soldOut: false, images: [] });
        refresh(true);
    }

    function deleteSouvenir(i) {
        if (!confirm('ต้องการลบสินค้านี้?')) return;
        siteData.souvenirs.splice(i, 1);
        refresh(true);
    }

    function svMove(i, dir) {
        const list = siteData.souvenirs;
        const j = i + dir;
        if (j < 0 || j >= list.length) return;
        [list[i], list[j]] = [list[j], list[i]];
        refresh(true);
    }

    function svUpdateText(i, field, value) {
        const p = siteData.souvenirs[i];
        if (!p[field] || typeof p[field] !== 'object') p[field] = {};
        if (value.trim() === '') delete p[field][currentLang];
        else p[field][currentLang] = value;
        refresh(false);
    }

    function svUpdatePrice(i, value) {
        const n = parseFloat(value);
        siteData.souvenirs[i].price = isNaN(n) || n < 0 ? 0 : n;
        refresh(false);
    }

    function svToggleSold(i, checked) {
        siteData.souvenirs[i].soldOut = !!checked;
        refresh(false);
    }

    function svRemoveImage(i, k) {
        siteData.souvenirs[i].images.splice(k, 1);
        refresh(true);
    }

    function svAddImageUrl(i) {
        const input = document.getElementById('svUrl' + i);
        const url = input ? input.value.trim() : '';
        if (!url) return;
        const p = siteData.souvenirs[i];
        if (!p.images) p.images = [];
        if (p.images.length >= MAX_IMAGES) { alert('เพิ่มรูปได้สูงสุด ' + MAX_IMAGES + ' รูปต่อสินค้า'); return; }
        p.images.push(url);
        refresh(true);
    }

    // ย่อรูป + แปลงเป็น JPEG ก่อนเก็บ เพื่อให้ไฟล์เล็ก (ประมาณ 50–150 KB ต่อรูป)
    function compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(reader.error || new Error('อ่านไฟล์ไม่ได้'));
            reader.onload = () => {
                const img = new Image();
                img.onerror = () => reject(new Error('ไฟล์รูปไม่ถูกต้อง'));
                img.onload = () => {
                    let w = img.naturalWidth, h = img.naturalHeight;
                    if (!w || !h) { reject(new Error('อ่านขนาดรูปไม่ได้')); return; }
                    const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
                    w = Math.round(w * scale);
                    h = Math.round(h * scale);
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#fff';          // พื้นหลังขาวสำหรับรูป PNG โปร่งใส
                    ctx.fillRect(0, 0, w, h);
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    async function svUploadImages(i, input) {
        const files = Array.from(input.files || []);
        if (!files.length) return;
        const p = siteData.souvenirs[i];
        if (!p.images) p.images = [];
        for (const f of files) {
            if (p.images.length >= MAX_IMAGES) { alert('เพิ่มรูปได้สูงสุด ' + MAX_IMAGES + ' รูปต่อสินค้า'); break; }
            if (!f.type.startsWith('image/')) continue;
            try {
                p.images.push(await compressImage(f));
            } catch (e) {
                alert('เพิ่มรูป "' + f.name + '" ไม่สำเร็จ: ' + e.message);
            }
        }
        input.value = '';
        refresh(true);
    }

    /* ---------------------------------------------------------------- บันทึก: อัปโหลดรูปใหม่ขึ้น GitHub เป็นไฟล์ก่อน
       รูปที่อัปโหลดจะถูกเก็บเป็นไฟล์ในโฟลเดอร์ souvenirs/ ของ repo (ไม่ฝังลง index.html)
       เพื่อไม่ให้ index.html ใหญ่จนเกิน 1 MB ซึ่ง GitHub API จะไม่ส่งเนื้อหาไฟล์กลับมา */
    function collectPending() {
        const out = [];
        (siteData.souvenirs || []).forEach(p => (p.images || []).forEach((src, k) => {
            if (/^data:image\//i.test(src)) out.push({ p, k });
        }));
        return out;
    }

    async function uploadPending(config, pending) {
        try {
            for (const { p, k } of pending) {
                const src = p.images[k];
                const path = 'souvenirs/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
                const res = await fetch(`https://api.github.com/repos/${config.username}/${config.repo}/contents/${path}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `token ${config.token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: 'Add souvenir image via Admin Panel',
                        content: src.split(',')[1],
                        branch: config.branch
                    })
                });
                if (!res.ok) {
                    let detail = '';
                    try { detail = (await res.json()).message || ''; } catch (e) { /* ignore */ }
                    throw new Error('HTTP ' + res.status + (detail ? ' — ' + detail : ''));
                }
                p.images[k] = path;   // เปลี่ยนจากข้อมูลรูปชั่วคราว เป็นพาธไฟล์ใน repo
            }
            return true;
        } catch (e) {
            alert('❌ อัปโหลดรูปสินค้าไม่สำเร็จ: ' + e.message + '\n(รูปที่อัปโหลดสำเร็จแล้วจะไม่ถูกอัปโหลดซ้ำ)');
            return false;
        } finally {
            refresh(editorVisible());
        }
    }

    /* ---------------------------------------------------------------- ต่อเข้ากับฟังก์ชันเดิมของ index.html */
    const origChangeLang = window.changeLang;
    if (typeof origChangeLang === 'function') {
        window.changeLang = function () {
            const r = origChangeLang.apply(this, arguments);
            refresh(editorVisible());
            return r;
        };
    }

    const origShowAdminTab = window.showAdminTab;
    if (typeof origShowAdminTab === 'function') {
        window.showAdminTab = function (tab) {
            const r = origShowAdminTab.apply(this, arguments);
            if (tab === 'souvenir') renderSouvenirEditor();
            // แก้บั๊กเดิม: showAdminTab ซ่อนทุกช่อง .admin-section รวมรายการเมนูที่ซ้อนอยู่ข้างใน จึงต้องวาดแท็บเมนูใหม่
            if (tab === 'menu' && typeof window.renderMenuEditor === 'function') window.renderMenuEditor();
            return r;
        };
    }

    const origSave = window.saveAllChanges;
    if (typeof origSave === 'function') {
        window.saveAllChanges = async function () {
            const pending = collectPending();
            if (pending.length) {
                const config = JSON.parse(localStorage.getItem('githubConfig') || 'null');
                // ถ้ายังไม่ตั้งค่า Token ให้ฟังก์ชันเดิมแจ้งเตือนตามปกติ
                if (config && config.token) {
                    if (!confirm('มีรูปสินค้าใหม่ ' + pending.length + ' รูปที่ยังไม่ได้อัปโหลด\nระบบจะอัปโหลดรูปไปที่ GitHub ก่อน แล้วจึงบันทึกข้อมูลส่วนอื่นต่อ\n\nดำเนินการต่อ?')) return;
                    if (!(await uploadPending(config, pending))) return;
                }
            }
            return origSave.apply(this, arguments);
        };
    }

    /* ---------------------------------------------------------------- เปิดให้ onclick ใน HTML เรียกใช้ */
    Object.assign(window, {
        renderSouvenirs, openSouvenir, svShowImg, renderSouvenirEditor,
        addSouvenir, deleteSouvenir, svMove, svUpdateText, svUpdatePrice,
        svToggleSold, svRemoveImage, svAddImageUrl, svUploadImages
    });

    // วาดครั้งแรก (กรณีสคริปต์ถูกโหลดหลัง window.onload ไปแล้ว)
    document.querySelectorAll('[data-i18n="nav_souvenir"], #souvenir [data-i18n]').forEach(el => {
        const v = T()[el.getAttribute('data-i18n')];
        if (v) el.innerHTML = v;
    });
    renderSouvenirs();
})();
