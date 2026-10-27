import { smartGoBack } from '../utils/smartBack';
import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  Alert, Image, ImageBackground, Modal, Platform, ScrollView, Text, TextInput,
  TouchableOpacity, View, Share, SafeAreaView,
  useWindowDimensions,
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import { useFonts, Roboto_400Regular, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import { useFocusEffect } from '@react-navigation/native';
import { useToast } from '../components/ui/ToastProvider';
import EPaperStyles from '../styles/EPaperStyles';
import { UserStore } from '../store/UserStore';
import { MODULE_HEADER_HEIGHT_WEB } from '../constants/subscriptionThemes';
import ModuleWebHeader from '../components/Modulewebheader';
import ModuleMobileHeader from '../components/ModuleMobileHeader';
import LayoutOne from '../components/newspaper/LayoutOne';
import LayoutTwo from '../components/newspaper/LayoutTwo';
// ─── Amber/Orange tokens (web only) ──────────────────────────────────────────
const O = { 50:'#FEF2F2', 100:'#FEE2E2', 200:'#FECACA', 400:'#DC2626', 600:'#B91C1C', 800:'#7F1D1D' };
const FONT_FAMILY = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular';

const w = {
  root: { flex:1, backgroundColor:'#F0F0F0', minHeight:'100vh' },
  topBar: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:32, paddingVertical:14, backgroundColor:'#ffffff', borderBottomWidth:1, borderBottomColor:'#EDE8E1' },
  topLeft: { flexDirection:'row', alignItems:'center', gap:6 },
  bcStep: { fontSize: 13, fontFamily: FONT_FAMILY, color:'#888888' },
  bcSep:  { fontSize: 15, fontFamily: FONT_FAMILY, color:'#CCCCCC', marginHorizontal:4 },
  bcCur:  { fontSize: 13, fontFamily: FONT_FAMILY, fontWeight:'600', color:'#111111' },
  backBtn: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:16, paddingVertical:8, backgroundColor:O[50], borderWidth:1, borderColor:O[200], borderRadius:8 },
  backBtnText: { fontSize: 13, fontFamily: FONT_FAMILY, fontWeight:'600', color:O[800] },
  scroll: { flex:1 },
  scrollContent: { paddingHorizontal:32, paddingTop:28, paddingBottom:60, alignItems:'center' },
  innerWrap: { width:'100%', maxWidth:1100, alignSelf:'center' },
  pageHeadRow: { flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between', marginBottom:24 },
  pageTitle: { fontSize: 24, fontFamily: FONT_FAMILY, fontWeight:'800', color:'#111111', marginBottom:3 },
  pageSub:   { fontSize: 14, fontFamily: FONT_FAMILY, color:'#888888' },
  metricsRow: { flexDirection:'row', gap:14, marginBottom:24 },
  mc: { flex:1, backgroundColor:'#ffffff', borderRadius:14, padding:20, borderWidth:1, borderColor:'#EDE8E1', overflow:'hidden' },
  mcBar: { position:'absolute', top:0, left:0, right:0, height:3 },
  mcBarArticles: { backgroundColor:O[400] },
  mcBarViews:    { backgroundColor:'#3B82F6' },
  mcBarPending:  { backgroundColor:'#F59E0B' },
  mcTop: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:14 },
  mcIcon: { width:36, height:36, borderRadius:9, backgroundColor:O[50], borderWidth:1, borderColor:O[200], alignItems:'center', justifyContent:'center' },
  mcIconBlue:   { backgroundColor:'#EFF6FF', borderColor:'#BFDBFE' },
  mcIconYellow: { backgroundColor:'#FFFBEB', borderColor:'#FDE68A' },
  mcBadge: { fontSize: 11, fontFamily: FONT_FAMILY, fontWeight:'600', color:O[800], backgroundColor:O[50], borderWidth:1, borderColor:O[200], paddingHorizontal:8, paddingVertical:3, borderRadius:20 },
  mcBadgeBlue:   { color:'#1E40AF', backgroundColor:'#EFF6FF', borderColor:'#BFDBFE' },
  mcBadgeYellow: { color:'#92400E', backgroundColor:'#FFFBEB', borderColor:'#FDE68A' },
  mcVal: { fontSize: 28, fontFamily: FONT_FAMILY, fontWeight:'800', color:'#111111', marginBottom:3 },
  mcLbl: { fontSize: 12, fontFamily: FONT_FAMILY, color:'#888888', fontWeight:'500' },
  sectionHead: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:16 },
  sectionTitle: { fontSize: 17, fontFamily: FONT_FAMILY, fontWeight:'800', color:'#111111' },
  sectionSub:   { fontSize: 13, fontFamily: FONT_FAMILY, color:'#888888', marginTop:2 },
  pill: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:O[50], borderWidth:1, borderColor:O[100], borderRadius:20, paddingHorizontal:12, paddingVertical:5 },
  pillTxt: { fontSize: 12, fontFamily: FONT_FAMILY, fontWeight:'700', color:O[800] },
  statusBadge: { borderRadius:999, paddingHorizontal:10, paddingVertical:3, alignSelf:'flex-start' },
  statusBadgeText: { fontSize: 10, fontFamily: FONT_FAMILY, fontWeight:'800' },
  actionBtn: { flexDirection:'row', alignItems:'center', gap:5, paddingVertical:7, paddingHorizontal:14, borderRadius:8, backgroundColor:O[50], borderWidth:1, borderColor:O[200] },
  actionBtnTxt: { fontSize: 12, fontFamily: FONT_FAMILY, fontWeight:'700', color:O[800] },
  actionBtnDanger: { flexDirection:'row', alignItems:'center', gap:5, paddingVertical:7, paddingHorizontal:14, borderRadius:8, backgroundColor:'#FEF2F2', borderWidth:1, borderColor:'#FECACA' },
  actionBtnDangerTxt: { fontSize: 12, fontFamily: FONT_FAMILY, fontWeight:'700', color:'#DC2626' },
  successOverlay: { position:'absolute', top:70, left:0, right:0, alignItems:'center', zIndex:999, pointerEvents:'none' },
  successBox: { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'#F0FDF4', borderWidth:1, borderColor:'#BBF7D0', borderRadius:12, paddingVertical:10, paddingHorizontal:18 },
  successTxt: { fontSize: 13, fontFamily: FONT_FAMILY, fontWeight:'700', color:'#15803D' },
  emptyWrap: { alignItems:'center', paddingVertical:60 },
  webModalRoot: { flex:1, backgroundColor:'#F7F4F0', minHeight:'100vh' },
  webModalHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:24, paddingVertical:14, backgroundColor:O[400], borderBottomWidth:2, borderBottomColor:O[600] },
  webModalHeaderTitle: { fontSize: 17, fontFamily: FONT_FAMILY, fontWeight:'800', color:'#ffffff', flex:1, textAlign:'center' },
  webModalCloseBtn: { width:36, height:36, borderRadius:8, backgroundColor:'rgba(255,255,255,0.2)', alignItems:'center', justifyContent:'center' },
  webFormScroll: { flex:1 },
  webFormContent: { paddingHorizontal:32, paddingTop:24, paddingBottom:60, alignItems:'center' },
  webFormInner: { width:'100%', maxWidth:820, alignSelf:'center' },
  emptyIcon: { width:56, height:56, borderRadius:14, backgroundColor:O[50], borderWidth:1, borderColor:O[200], alignItems:'center', justifyContent:'center', marginBottom:14 },
  emptyTxt:  { fontSize: 15, fontFamily: FONT_FAMILY, fontWeight:'600', color:'#888888', marginBottom:4 },
  emptySub:  { fontSize: 13, fontFamily: FONT_FAMILY, color:'#AAAAAA' },
  loadingTxt:{ fontSize: 14, fontFamily: FONT_FAMILY, color:'#888888', paddingVertical:40, textAlign:'center' },
};

const getWebStyles = (windowWidth) => {
  const isPhone = windowWidth <= 640;
  const isNarrow = windowWidth <= 820;
  const isTablet = windowWidth <= 1024;
  if (!isPhone && !isNarrow && !isTablet) return w;
  return {
    ...w,
    topBar: { ...w.topBar, alignItems: isPhone ? 'flex-start' : 'center', flexDirection: isPhone ? 'column' : 'row', gap: isPhone ? 10 : 12, paddingHorizontal: isPhone ? 16 : 24, paddingVertical: isPhone ? 12 : 14 },
    topLeft: { ...w.topLeft, flexWrap: 'wrap', maxWidth: '100%' },
    backBtn: { ...w.backBtn, alignSelf: isPhone ? 'flex-start' : 'auto', paddingHorizontal: isPhone ? 12 : 16 },
    scrollContent: { ...w.scrollContent, paddingHorizontal: isPhone ? 14 : 24, paddingTop: isPhone ? 22 : 28 },
    innerWrap: { ...w.innerWrap, maxWidth: isTablet ? 820 : 1100 },
    pageHeadRow: { ...w.pageHeadRow, alignItems: isPhone ? 'stretch' : 'flex-end', flexDirection: isPhone ? 'column' : 'row', marginBottom: isPhone ? 18 : 24 },
    pageTitle: { ...w.pageTitle, fontSize: isPhone ? 22 : 24 },
    pageSub: { ...w.pageSub, flexShrink: 1, lineHeight: 20 },
    metricsRow: { ...w.metricsRow, flexWrap: 'wrap', gap: isPhone ? 10 : 12, marginBottom: isPhone ? 20 : 24 },
    mc: { ...w.mc, flex: isPhone ? 0 : 1, width: isPhone ? '100%' : 'calc(33.333% - 8px)', minWidth: isPhone ? '100%' : 180, padding: isPhone ? 16 : 18 },
    mcTop: { ...w.mcTop, marginBottom: isPhone ? 10 : 14 },
    sectionHead: { ...w.sectionHead, alignItems: isPhone ? 'flex-start' : 'center', flexDirection: isPhone ? 'column' : 'row', gap: isPhone ? 10 : 12 },
    actionBtn: { ...w.actionBtn, justifyContent: 'center', minWidth: isPhone ? 'calc(50% - 4px)' : 92, flexGrow: isPhone ? 1 : 0 },
    actionBtnDanger: { ...w.actionBtnDanger, justifyContent: 'center', minWidth: isPhone ? 'calc(50% - 4px)' : 92, flexGrow: isPhone ? 1 : 0 },
    successOverlay: { ...w.successOverlay, top: isPhone ? 84 : 70, paddingHorizontal: 14 },
    successBox: { ...w.successBox, maxWidth: '100%' },
    webModalHeader: { ...w.webModalHeader, paddingHorizontal: isPhone ? 14 : 24, gap: isPhone ? 8 : 12 },
    webModalHeaderTitle: { ...w.webModalHeaderTitle, fontSize: isPhone ? 15 : 17 },
    webFormContent: { ...w.webFormContent, paddingHorizontal: isPhone ? 14 : 24, paddingTop: isPhone ? 18 : 24 },
  };
};

function StatusBadge({ status, web }) {
  const cfg = {
    approved:{ bg:'#DCFCE7', color:'#16A34A', label:'Approved' },
    pending: { bg:'#FFF7ED', color:'#DC2626', label:'Pending'  },
    rejected:{ bg:'#FEE2E2', color:'#DC2626', label:'Rejected' },
  }[status] || { bg:'#F1F5F9', color:'#64748B', label:status||'—' };
  const s = web ? w : EPaperStyles;
  return (
    <View style={[s.statusBadge,{backgroundColor:cfg.bg}]}>
      <Text style={[s.statusBadgeText,{color:cfg.color}]}>{cfg.label}</Text>
    </View>
  );
}

export default function EPaperScreen({navigation}){
  const{showToast}=useToast();
  const isWeb=Platform.OS==='web';
  const { width: windowWidth } = useWindowDimensions();
  const ws = React.useMemo(() => getWebStyles(windowWidth), [windowWidth]);

  // ✅ FIX: useFonts import to tha, lekin kabhi call nahi ho raha tha —
  // isliye niche `fontsLoaded` use hote hi "doesn't exist" crash aa raha tha.
  const [fontsLoaded] = useFonts({ Roboto_400Regular, Roboto_700Bold, Roboto_900Black });

  const[loading,setLoading]=useState(true);
  const[currentUser,setCurrentUser]=useState(null);
  const[isAdmin,setIsAdmin]=useState(false);
  const[items,setItems]=useState([]);
  const[totalViews,setTotalViews]=useState(0);
  const[viewItem,setViewItem]=useState(null);
  const[layouts,setLayouts]=useState([]);
  const[manageDateKey,setManageDateKey]=useState(null);
  const[manageDateFilter,setManageDateFilter]=useState('all');
  const[successMsg,setSuccessMsg]=useState('');
  const[searchQuery,setSearchQuery]=useState('');
  const[statusFilter,setStatusFilter]=useState('all');
  const[statusFilterOpen,setStatusFilterOpen]=useState(false);
  const [reporterModal, setReporterModal] = useState(false);
const [reporterName, setReporterName] = useState('');
const [reporterLocation, setReporterLocation] = useState('');
const [reporterDate, setReporterDate] = useState('');
  const showSuccess=(msg)=>{setSuccessMsg(msg);setTimeout(()=>setSuccessMsg(''),3000);};

  const loadData=useCallback(async()=>{
    setLoading(true);
    const user=await UserStore.getCurrentUser();
    if(!user){navigation.replace('Login');return;}
    setCurrentUser(user);setIsAdmin(user.role==='admin');
    const data=await UserStore.getEPaperSummary();
    if(data){
      const filtered=user.role==='admin'?data.items:data.items.filter(i=>i.status==='approved'||i.createdBy===user.email);
      setItems(filtered);setTotalViews(data.totalViews);
      setLayouts(Array.isArray(data.layouts)?data.layouts:[]);
    }
    setLoading(false);
  },[navigation]);
  useFocusEffect(useCallback(()=>{loadData();},[loadData]));

  const handleDelete=(item)=>{Alert.alert('Delete',`"${(item.title||'').replace(/<[^>]*>/g,'')||'This item'}" will be deleted. Continue?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{const user=await UserStore.getCurrentUser();if(!user)return;await UserStore.updateUser(user.email,{epapers:(user.epapers||[]).filter(e=>e.id!==item.id)});showSuccess('Deleted.');loadData();}}]);};
  const handleApprove=async(item)=>{const user=await UserStore.getCurrentUser();if(!user)return;await UserStore.updateUser(user.email,{epapers:(user.epapers||[]).map(e=>e.id===item.id?{...e,status:'approved'}:e)});showSuccess('Approved!');loadData();};
  const handleReject=async(item)=>{const user=await UserStore.getCurrentUser();if(!user)return;await UserStore.updateUser(user.email,{epapers:(user.epapers||[]).map(e=>e.id===item.id?{...e,status:'rejected'}:e)});showSuccess('Rejected.');loadData();};
  const handleView=async(item)=>{const result=await UserStore.updateEPaperItem(item.id,'view');if(!result?.ok){showToast(result?.message||'Error.','error');return;}setViewItem({...item,views:(item.views||0)+1});loadData();};
  const handleShare=async(item)=>{try{await Share.share({title:(item.title||'').replace(/<[^>]*>/g,''),message:(item.description||'').replace(/<[^>]*>/g,'')});showSuccess('Shared!');}catch{showToast('Share failed.','error');}};

  const ViewModal=()=>{
    if(!viewItem)return null;
    const plainTitle=(viewItem.title||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').trim();
    const plainDescription=(viewItem.description||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').trim();

    if(isWeb){
      return(
        <Modal visible={!!viewItem} animationType="fade" onRequestClose={()=>setViewItem(null)}>
          <View style={ws.webModalRoot}>
            <View style={ws.webModalHeader}>
              <TouchableOpacity onPress={()=>setViewItem(null)} style={ws.webModalCloseBtn}>
                <Feather name="arrow-left" size={18} color="#ffffff"/>
              </TouchableOpacity>
              <Text style={[ws.webModalHeaderTitle,{marginHorizontal:8}]} numberOfLines={1}>View E-Paper</Text>
              <View style={{width:36}}/>
            </View>
            <ScrollView contentContainerStyle={ws.webFormContent} showsVerticalScrollIndicator={false}>
              <View style={ws.webFormInner}>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                  <StatusBadge status={viewItem.status} web/>
                  <Text style={{fontSize: 12, fontFamily: FONT_FAMILY,color:'#AAAAAA',fontWeight:'500'}}>{viewItem.publishDate||viewItem.createdAt?.slice(0,10)||''}</Text>
                </View>
                {viewItem.state?(
                  <View style={{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:6,backgroundColor:O[50],borderWidth:1,borderColor:O[200],borderRadius:999,paddingHorizontal:12,paddingVertical:5,marginBottom:16}}>
                    <Feather name="map-pin" size={12} color={O[600]}/>
                    <Text style={{fontSize: 11, fontFamily: FONT_FAMILY,fontWeight:'800',color:O[800]}}>{viewItem.state}</Text>
                  </View>
                ):null}
                <View style={{backgroundColor:'#ffffff',borderWidth:1.5,borderColor:'#E5DDD5',borderRadius:16,padding:windowWidth<=640?16:24,marginBottom:20}}>
                  <Text style={{fontSize:windowWidth<=640?19:22,fontWeight:'800',color:'#111111',lineHeight:windowWidth<=640?27:30,marginBottom:12}}>{plainTitle||'Untitled E-Paper'}</Text>
                  <View style={{height:1,backgroundColor:'#F0EBE4',marginBottom:14}}/>
                  <Text style={{fontSize: 14, fontFamily: FONT_FAMILY,color:'#555555',lineHeight:24}}>{plainDescription||'No description available.'}</Text>
                </View>
                {viewItem.images?.length>0&&(
                  <View style={{backgroundColor:'#ffffff',borderWidth:1.5,borderColor:'#E5DDD5',borderRadius:16,padding:windowWidth<=640?14:20,marginBottom:20}}>
                    <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:14}}>
                      <Feather name="image" size={15} color={O[600]}/>
                      <Text style={{fontSize: 13, fontFamily: FONT_FAMILY,fontWeight:'800',color:'#111111'}}>Images ({viewItem.images.length})</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {viewItem.images.map((img,idx)=>(
                        <Image key={idx} source={{uri:img}} style={{width:200,height:140,borderRadius:12,marginRight:12,borderWidth:1,borderColor:'#E5DDD5'}}/>
                      ))}
                    </ScrollView>
                  </View>
                )}
                <View style={{flexDirection:'row',flexWrap:'wrap',gap:windowWidth<=640?12:20,backgroundColor:'#ffffff',borderWidth:1.5,borderColor:'#E5DDD5',borderRadius:14,padding:16}}>
                  <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
                    <Feather name="eye" size={14} color={O[400]}/>
                    <Text style={{fontSize: 13, fontFamily: FONT_FAMILY,fontWeight:'700',color:'#555555'}}>{viewItem.views??0} Views</Text>
                  </View>
                  <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
                    <Feather name="user" size={14} color={O[400]}/>
                    <Text style={{fontSize: 13, fontFamily: FONT_FAMILY,fontWeight:'700',color:'#555555'}}>{viewItem.createdBy?.split('@')[0]||'user'}</Text>
                  </View>
                  <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
                    <Feather name="calendar" size={14} color={O[400]}/>
                    <Text style={{fontSize: 13, fontFamily: FONT_FAMILY,fontWeight:'700',color:'#555555'}}>{viewItem.publishDate||viewItem.createdAt?.slice(0,10)||''}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      );
    }

    return(
      <Modal visible={!!viewItem} animationType="slide" onRequestClose={()=>setViewItem(null)}>
        <SafeAreaView style={EPaperStyles.viewModalSafeArea}>
          <View style={EPaperStyles.modalHeader}>
            <TouchableOpacity onPress={()=>setViewItem(null)} style={EPaperStyles.modalCloseBtn}><Feather name="arrow-left" size={20} color="#ffffff"/></TouchableOpacity>
            <Text style={EPaperStyles.modalHeaderTitle} numberOfLines={1}>View E-Paper</Text>
            <View style={EPaperStyles.modalHeaderRight}/>
          </View>
          <ScrollView contentContainerStyle={EPaperStyles.viewModalContent} nestedScrollEnabled>
            <StatusBadge status={viewItem.status}/>
            <View style={EPaperStyles.viewTextCard}><Text style={EPaperStyles.viewTitleText}>{plainTitle||'Untitled E-Paper'}</Text><Text style={EPaperStyles.viewDescriptionText}>{plainDescription||'No description available.'}</Text></View>
            {viewItem.state?(<View style={EPaperStyles.stateChip}><Feather name="map-pin" size={12} color="#FF2D78"/><Text style={EPaperStyles.stateChipText}>{viewItem.state}</Text></View>):null}
            {viewItem.images?.length>0&&(<View style={EPaperStyles.viewImagesSection}><Text style={EPaperStyles.fieldLabel}>Images</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} style={EPaperStyles.thumbRow}>{viewItem.images.map((img,idx)=>(<Image key={idx} source={{uri:img}} style={EPaperStyles.viewImage}/>))}</ScrollView></View>)}
            <View style={EPaperStyles.statsRow}>
              <View style={EPaperStyles.statItem}><Feather name="eye" size={12} color="#64748b"/><Text style={EPaperStyles.statText}>{viewItem.views??0} Views</Text></View>
              <View style={EPaperStyles.statItem}><Feather name="calendar" size={12} color="#64748b"/><Text style={EPaperStyles.statText}>{viewItem.publishDate||viewItem.createdAt?.slice(0,10)||''}</Text></View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // WEB LAYOUT
  // ══════════════════════════════════════════════════════════════════════════
  if(isWeb){
    const filteredItems = items.filter(i => {
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const plain = (i.title || '').replace(/<[^>]*>/g, '').toLowerCase();
        if (!plain.includes(searchQuery.trim().toLowerCase())) return false;
      }
      return true;
    });
    const grouped_manage = manageDateKey ? items.filter(i=>{
      const dateMatch=(i.publishDate||i.createdAt?.slice(0,10)||'Unknown')===manageDateKey;
      if(!dateMatch)return false;
      if(manageDateFilter==='published')return i.status==='approved';
      if(manageDateFilter==='unpublished')return i.status!=='approved';
      return true;
    }) : [];

    return(
      <View style={ws.root}>
        {/* ✅ Web header — design ek hi jagah (components/ModuleWebHeader.js) se aata hai */}
        <ModuleWebHeader title="E-Paper" navigation={navigation} />

        {successMsg?(<View style={ws.successOverlay}><View style={ws.successBox}><Feather name="check-circle" size={16} color="#16A34A"/><Text style={ws.successTxt}>{successMsg}</Text></View></View>):null}

        <ScrollView style={ws.scroll} contentContainerStyle={ws.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={ws.innerWrap}>
            <View style={{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16,marginBottom:24}}>
              <View style={{flexDirection:'row',alignItems:'center',gap:14}}>
                <View style={{width:52,height:52,borderRadius:14,backgroundColor:'#FEE2E2',alignItems:'center',justifyContent:'center'}}>
                  <Feather name="file-text" size={24} color="#9D0410"/>
                </View>
                <View>
                  <Text style={ws.pageTitle}>E-Paper</Text>
                  <Text style={ws.pageSub}>Digital newspaper — rich-text articles with images.</Text>
                </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
                <TouchableOpacity
                  style={{flexDirection:'row',alignItems:'center',gap:6,paddingVertical:10,paddingHorizontal:18,borderRadius:10,backgroundColor:'#9D0410'}}
                  onPress={() => {
  const today = new Date().toISOString().slice(0, 10);
  setReporterName(currentUser?.name || currentUser?.email?.split('@')[0] || '');
  setReporterLocation('');
  setReporterDate(today);
  setReporterModal(true);
}}
                  activeOpacity={0.85}
                >
                  <Feather name="plus" size={14} color="#ffffff"/>
                  <Text style={{fontSize: 13, fontFamily: FONT_FAMILY,fontWeight:'700',color:'#ffffff'}}>Add Newspaper</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{flexDirection:'row',alignItems:'center',gap:6,paddingVertical:10,paddingHorizontal:18,borderRadius:10,backgroundColor:'#ffffff',borderWidth:1.5,borderColor:'#FCA5A5'}}
                  onPress={async()=>{
                    if(!window.confirm('All Epaper clear?')) return;
                    const user = await UserStore.getCurrentUser();
                    if(!user) return;
                    await UserStore.updateUser(user.email, { epapers: [] });
                    loadData();
                  }}
                  activeOpacity={0.85}
                >
                  <Feather name="trash-2" size={14} color="#9D0410"/>
                  <Text style={{fontSize: 13, fontFamily: FONT_FAMILY,fontWeight:'700',color:'#9D0410'}}>Clear All</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={[ws.metricsRow,{flexWrap:'wrap'}]}>
              <View style={ws.mc}>
                <View style={{position:'absolute',bottom:-46,right:-34,width:150,height:150,borderRadius:75,backgroundColor:'rgba(220,38,38,0.07)'}}/>
                <View style={{position:'absolute',bottom:-66,right:-54,width:180,height:180,borderRadius:90,backgroundColor:'rgba(220,38,38,0.10)'}}/>
                <View style={[ws.mcBar,ws.mcBarArticles]}/>
                <View style={ws.mcTop}><View style={ws.mcIcon}><Feather name="file-text" size={16} color={O[600]}/></View><Text style={ws.mcBadge}>Total</Text></View>
                <Text style={ws.mcVal}>{filteredItems.length}</Text><Text style={ws.mcLbl}>Articles</Text>
                <Text style={{fontSize: 11, fontFamily: FONT_FAMILY,color:'#AAAAAA',marginTop:4}}>Total e-paper articles published</Text>
                <Feather name="arrow-up-right" size={14} color={O[600]} style={{position:'absolute',bottom:16,right:16}}/>
              </View>
              <View style={ws.mc}>
                <View style={{position:'absolute',bottom:-46,right:-34,width:150,height:150,borderRadius:75,backgroundColor:'rgba(59,130,246,0.07)'}}/>
                <View style={{position:'absolute',bottom:-66,right:-54,width:180,height:180,borderRadius:90,backgroundColor:'rgba(59,130,246,0.10)'}}/>
                <View style={[ws.mcBar,ws.mcBarViews]}/>
                <View style={ws.mcTop}><View style={[ws.mcIcon,ws.mcIconBlue]}><Feather name="eye" size={16} color="#3B82F6"/></View><Text style={[ws.mcBadge,ws.mcBadgeBlue]}>All time</Text></View>
                <Text style={ws.mcVal}>{totalViews}</Text><Text style={ws.mcLbl}>Total views</Text>
                <Text style={{fontSize: 11, fontFamily: FONT_FAMILY,color:'#AAAAAA',marginTop:4}}>Total views on e-paper articles</Text>
                <Feather name="arrow-up-right" size={14} color="#3B82F6" style={{position:'absolute',bottom:16,right:16}}/>
              </View>
              <View style={ws.mc}>
                <View style={{position:'absolute',bottom:-46,right:-34,width:150,height:150,borderRadius:75,backgroundColor:'rgba(34,197,94,0.07)'}}/>
                <View style={{position:'absolute',bottom:-66,right:-54,width:180,height:180,borderRadius:90,backgroundColor:'rgba(34,197,94,0.10)'}}/>
                <View style={[ws.mcBar,{backgroundColor:'#22C55E'}]}/>
                <View style={ws.mcTop}><View style={[ws.mcIcon,{backgroundColor:'#F0FDF4',borderColor:'#BBF7D0'}]}><Feather name="clock" size={16} color="#22C55E"/></View><Text style={[ws.mcBadge,{color:'#15803D',backgroundColor:'#F0FDF4',borderColor:'#BBF7D0'}]}>Pending</Text></View>
                <Text style={ws.mcVal}>{filteredItems.filter(i=>i.status==='pending').length}</Text><Text style={ws.mcLbl}>Pending</Text>
                <Text style={{fontSize: 11, fontFamily: FONT_FAMILY,color:'#AAAAAA',marginTop:4}}>Articles awaiting review</Text>
              </View>
              <View style={ws.mc}>
                <View style={{position:'absolute',bottom:-46,right:-34,width:150,height:150,borderRadius:75,backgroundColor:'rgba(139,92,246,0.07)'}}/>
                <View style={{position:'absolute',bottom:-66,right:-54,width:180,height:180,borderRadius:90,backgroundColor:'rgba(139,92,246,0.10)'}}/>
                <View style={[ws.mcBar,{backgroundColor:'#8B5CF6'}]}/>
                <View style={ws.mcTop}><View style={[ws.mcIcon,{backgroundColor:'#FAF5FF',borderColor:'#E9D5FF'}]}><Feather name="check-square" size={16} color="#8B5CF6"/></View><Text style={[ws.mcBadge,{color:'#6D28D9',backgroundColor:'#FAF5FF',borderColor:'#E9D5FF'}]}>Published</Text></View>
                <Text style={ws.mcVal}>{filteredItems.filter(i=>i.status==='approved').length}</Text><Text style={ws.mcLbl}>Published</Text>
                <Text style={{fontSize: 11, fontFamily: FONT_FAMILY,color:'#AAAAAA',marginTop:4}}>Total published articles</Text>
                <Feather name="arrow-up-right" size={14} color="#8B5CF6" style={{position:'absolute',bottom:16,right:16}}/>
              </View>
            </View>

            <View style={[ws.sectionHead,{flexWrap:'wrap'}]}>
              <View><Text style={ws.sectionTitle}>E-Paper Articles</Text><Text style={ws.sectionSub}>All published and pending articles</Text></View>
              <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
                <View style={{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'#ffffff',borderWidth:1,borderColor:'#EDE8E1',borderRadius:10,paddingHorizontal:12,paddingVertical:8,minWidth:200}}>
                  <Feather name="search" size={14} color="#AAAAAA"/>
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search articles..."
                    placeholderTextColor="#AAAAAA"
                    style={{flex:1,fontSize: 13, fontFamily: FONT_FAMILY,color:'#333333',outlineStyle:'none'}}
                  />
                </View>
                <View style={{position:'relative'}}>
                  <TouchableOpacity
                    style={{flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'#ffffff',borderWidth:1,borderColor:'#EDE8E1',borderRadius:10,paddingHorizontal:12,paddingVertical:8}}
                    onPress={() => setStatusFilterOpen(v=>!v)}
                    activeOpacity={0.8}
                  >
                    <Feather name="filter" size={13} color="#888888"/>
                    <Text style={{fontSize: 13, fontFamily: FONT_FAMILY,fontWeight:'600',color:'#333333'}}>
                      {statusFilter==='all'?'All Status':statusFilter==='approved'?'Published':statusFilter==='pending'?'Pending':'Rejected'}
                    </Text>
                    <Feather name="chevron-down" size={13} color="#888888"/>
                  </TouchableOpacity>
                  {statusFilterOpen ? (
                    <View style={{position:'absolute',top:'110%',right:0,backgroundColor:'#ffffff',borderWidth:1,borderColor:'#EDE8E1',borderRadius:10,paddingVertical:6,minWidth:150,zIndex:20,boxShadow:'0 8px 24px rgba(0,0,0,0.12)'}}>
                      {[{key:'all',label:'All Status'},{key:'approved',label:'Published'},{key:'pending',label:'Pending'},{key:'rejected',label:'Rejected'}].map(opt=>(
                        <TouchableOpacity key={opt.key} onPress={()=>{setStatusFilter(opt.key);setStatusFilterOpen(false);}} style={{paddingHorizontal:14,paddingVertical:8}}>
                          <Text style={{fontSize: 13, fontFamily: FONT_FAMILY,color: statusFilter===opt.key ? '#9D0410' : '#333333', fontWeight: statusFilter===opt.key?'700':'500'}}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {loading?(<Text style={ws.loadingTxt}>Loading articles…</Text>
            ):filteredItems.length===0?(
              <View style={{alignItems:'center',justifyContent:'center',paddingVertical:70,backgroundColor:'#ffffff',borderWidth:1,borderColor:'#EDE8E1',borderRadius:16}}>
                <View style={{width:96,height:96,borderRadius:48,backgroundColor:'#FBEEE6',alignItems:'center',justifyContent:'center',marginBottom:20}}>
                  <Feather name="file-text" size={40} color="#D6A98A"/>
                </View>
                <Text style={{fontSize: 17, fontFamily: FONT_FAMILY,fontWeight:'800',color:'#111111',marginBottom:6}}>No articles yet</Text>
                <Text style={{fontSize: 13, fontFamily: FONT_FAMILY,color:'#888888',marginBottom:20}}>You haven't published any e-paper articles yet.</Text>
                <TouchableOpacity
                  style={{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'#9D0410',paddingVertical:12,paddingHorizontal:22,borderRadius:10}}
                  onPress={() => {
  const today = new Date().toISOString().slice(0, 10);
  setReporterName(currentUser?.name || currentUser?.email?.split('@')[0] || '');
  setReporterLocation('');
  setReporterDate(today);
  setReporterModal(true);
}}
                  activeOpacity={0.85}
                >
                  <Feather name="file-plus" size={15} color="#ffffff"/>
                  <Text style={{fontSize: 13, fontFamily: FONT_FAMILY,fontWeight:'700',color:'#ffffff'}}>Add Your First Newspaper</Text>
                </TouchableOpacity>
              </View>
            ):(()=>{
              const grouped = {};
              filteredItems.forEach(item=>{
                const dateKey = item.publishDate||item.createdAt?.slice(0,10)||'Unknown';
                if(!grouped[dateKey]) grouped[dateKey]=[];
                grouped[dateKey].push(item);
              });
              const sortedDates = Object.keys(grouped).sort((a,b)=>b.localeCompare(a));

              return(
                <View style={{width:'100%'}}>
                  {sortedDates.map(dateKey=>(
                    <View key={dateKey} style={{backgroundColor:'#ffffff',borderWidth:1,borderColor:'#EDE8E1',borderRadius:14,marginBottom:12,overflow:'hidden'}}>

                      {/* Date header */}
                      <View style={{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:windowWidth<=640?14:18,paddingVertical:12,backgroundColor:O[50],borderBottomWidth:1,borderBottomColor:O[100]}}>
                        <Feather name="calendar" size={13} color={O[600]}/>
                        <Text style={{fontSize: 13, fontFamily: FONT_FAMILY,fontWeight:'800',color:O[800]}}>{dateKey}</Text>
                        <View style={{marginLeft:'auto',flexDirection:'row',alignItems:'center',gap:6}}>
                          {(()=>{
                            const approvedCount = grouped[dateKey].filter(i=>i.status==='approved').length;
                            const unpublishedCount = grouped[dateKey].filter(i=>i.status!=='approved').length;
                            const isPublished = approvedCount > 0;
                            if(isPublished){
                              return(
                                <TouchableOpacity
                                  onPress={async()=>{ const allItems=grouped[dateKey].filter(i=>i.status!=='approved'); for(const item of allItems){await handleApprove(item);} }}
                                  style={{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#F0FDF4',borderWidth:1,borderColor:'#BBF7D0',borderRadius:999,paddingHorizontal:10,paddingVertical:3}}
                                >
                                  <View style={{width:6,height:6,borderRadius:3,backgroundColor:'#22C55E'}}/>
                                  <Text style={{fontSize: 11, fontFamily: FONT_FAMILY,fontWeight:'700',color:'#16A34A'}}>{approvedCount} Published</Text>
                                </TouchableOpacity>
                              );
                            } else {
                              return(
                                <TouchableOpacity
                                  onPress={async()=>{ const pendingItems=grouped[dateKey].filter(i=>i.status!=='approved'); for(const item of pendingItems){await handleApprove(item);} }}
                                  style={{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#FFF7ED',borderWidth:1,borderColor:O[200],borderRadius:999,paddingHorizontal:10,paddingVertical:3}}
                                >
                                  <View style={{width:6,height:6,borderRadius:3,backgroundColor:O[400]}}/>
                                  <Text style={{fontSize: 11, fontFamily: FONT_FAMILY,fontWeight:'700',color:O[800]}}>{unpublishedCount} Unpublished</Text>
                                </TouchableOpacity>
                              );
                            }
                          })()}
                        </View>
                      </View>

                      {/* Article titles */}
                      {grouped[dateKey].map((item,idx)=>{
                        const plainTitle=(item.title||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').trim();
                        const isLast=idx===grouped[dateKey].length-1;
                        return(
                          <View key={item.id} style={{paddingHorizontal:windowWidth<=640?14:18,paddingVertical:10,borderBottomWidth:isLast?0:1,borderBottomColor:'#F5F2EE',flexDirection:'row',alignItems:'center',gap:8}}>
                            <Feather name="file-text" size={13} color={O[400]}/>
                            <Text style={{flex:1,fontSize:windowWidth<=640?13:14,fontWeight:'600',color:'#333333',lineHeight:20}} numberOfLines={1}>{plainTitle||'Untitled'}</Text>
                          </View>
                        );
                      })}

                      {/* Bottom buttons */}
                      <View style={{paddingHorizontal:windowWidth<=640?14:18,paddingVertical:12,borderTopWidth:1,borderTopColor:'#F5F2EE',flexDirection:'row',gap:8}}>
                        <TouchableOpacity
                          style={{flexDirection:'row',alignItems:'center',gap:5,paddingVertical:7,paddingHorizontal:14,borderRadius:8,backgroundColor:O[50],borderWidth:1,borderColor:O[200]}}
                          onPress={()=>setManageDateKey(dateKey)}
                        >
                          <Feather name="settings" size={13} color={O[600]}/>
                          <Text style={{fontSize: 12, fontFamily: FONT_FAMILY,fontWeight:'700',color:O[800]}}>Manage Articles</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{flexDirection:'row',alignItems:'center',gap:5,paddingVertical:7,paddingHorizontal:14,borderRadius:8,backgroundColor:'#F0FDF4',borderWidth:1,borderColor:'#BBF7D0'}}
                          onPress={async()=>{
                            const user = await UserStore.getCurrentUser();
                            const layouts = Array.isArray(user?.newspaper_layouts) ? user.newspaper_layouts : [];
                            const layout = layouts.find(l => l.publishDate === dateKey);
                            if(layout){
                              navigation.navigate('NewspaperPage',{
                                loadLayout: layout,
                              });
                            } else {
                              alert('No newspaper layout was found for this date.');
                            }
                          }}
                        >
                          <Feather name="eye" size={13} color="#16A34A"/>
                          <Text style={{fontSize: 12, fontFamily: FONT_FAMILY,fontWeight:'700',color:'#16A34A'}}>View Newspaper</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })()}
          </View>
        </ScrollView>

        <ViewModal/>
<Modal
  visible={reporterModal}
  animationType="fade"
  transparent
  onRequestClose={() => setReporterModal(false)}
>
  <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.45)',alignItems:'center',justifyContent:'center',padding:20}}>
    <View style={{backgroundColor:'#ffffff',borderRadius:18,padding:24,width:'100%',maxWidth:440,shadowColor:'#000',shadowOffset:{width:0,height:8},shadowOpacity:0.18,shadowRadius:24,elevation:12}}>

      {/* Header */}
      <View style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:6}}>
        <View style={{width:38,height:38,borderRadius:10,backgroundColor:O[50],borderWidth:1,borderColor:O[200],alignItems:'center',justifyContent:'center'}}>
          <Feather name="user" size={18} color={O[600]}/>
        </View>
        <View>
          <Text style={{fontSize: 16, fontFamily: FONT_FAMILY,fontWeight:'800',color:'#111111'}}>Reporter Details</Text>
          <Text style={{fontSize: 12, fontFamily: FONT_FAMILY,color:'#888888',marginTop:1}}>Please confirm before publishing</Text>
        </View>
      </View>

      <View style={{height:1,backgroundColor:'#F0EBE4',marginVertical:16}}/>

      {/* Name */}
      <Text style={{fontSize: 12, fontFamily: FONT_FAMILY,fontWeight:'700',color:'#555555',marginBottom:6}}>Reporter Name</Text>
      <View style={{flexDirection:'row',alignItems:'center',gap:8,borderWidth:1.5,borderColor:'#E5DDD5',borderRadius:10,paddingHorizontal:12,paddingVertical:10,marginBottom:14,backgroundColor:'#FAFAFA'}}>
        <Feather name="user" size={14} color="#AAAAAA"/>
        <TextInput
          value={reporterName}
          onChangeText={setReporterName}
          placeholder="Enter your name"
          placeholderTextColor="#BBBBBB"
          style={{flex:1,fontSize: 14, fontFamily: FONT_FAMILY,color:'#111111'}}
        />
      </View>

      {/* Location */}
      <Text style={{fontSize: 12, fontFamily: FONT_FAMILY,fontWeight:'700',color:'#555555',marginBottom:6}}>Location / place</Text>
      <View style={{flexDirection:'row',alignItems:'center',gap:8,borderWidth:1.5,borderColor:'#E5DDD5',borderRadius:10,paddingHorizontal:12,paddingVertical:10,marginBottom:14,backgroundColor:'#FAFAFA'}}>
        <Feather name="map-pin" size={14} color="#AAAAAA"/>
        <TextInput
          value={reporterLocation}
          onChangeText={setReporterLocation}
          placeholder="Place"
          placeholderTextColor="#BBBBBB"
          style={{flex:1,fontSize: 14, fontFamily: FONT_FAMILY,color:'#111111'}}
        />
      </View>

      {/* Date */}
      <Text style={{fontSize: 12, fontFamily: FONT_FAMILY,fontWeight:'700',color:'#555555',marginBottom:6}}>Publish Date</Text>
      <View style={{flexDirection:'row',alignItems:'center',gap:8,borderWidth:1.5,borderColor:'#E5DDD5',borderRadius:10,paddingHorizontal:12,paddingVertical:10,marginBottom:22,backgroundColor:'#FAFAFA'}}>
        <Feather name="calendar" size={14} color="#AAAAAA"/>
        {Platform.OS==='web' ? (
          <input
            type="date"
            value={reporterDate}
            onChange={e=>setReporterDate(e.target.value)}
            style={{flex:1,fontSize: 14, fontFamily: FONT_FAMILY,color:'#111111',border:'none',outline:'none',backgroundColor:'transparent',cursor:'pointer',width:'100%'}}
          />
        ) : (
          <TextInput
            value={reporterDate}
            onChangeText={setReporterDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#BBBBBB"
            style={{flex:1,fontSize: 14, fontFamily: FONT_FAMILY,color:'#111111'}}
          />
        )}
      </View>

      {/* Buttons */}
      <View style={{flexDirection:'row',gap:10}}>
        <TouchableOpacity
          onPress={()=>setReporterModal(false)}
          style={{flex:1,paddingVertical:11,borderRadius:10,borderWidth:1.5,borderColor:'#E5DDD5',alignItems:'center',justifyContent:'center'}}
        >
          <Text style={{fontSize: 14, fontFamily: FONT_FAMILY,fontWeight:'700',color:'#888888'}}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={()=>{
            if(!reporterName.trim()){showToast('Reporter name required!','error');return;}
            setReporterModal(false);
            navigation.navigate('NewspaperPage',{
              reporterName:reporterName.trim(),
              reporterLocation:reporterLocation.trim(),
              publishDate:reporterDate,
            });
          }}
          style={{flex:2,paddingVertical:11,borderRadius:10,backgroundColor:O[400],alignItems:'center',justifyContent:'center',flexDirection:'row',gap:7}}
          activeOpacity={0.85}
        >
          <Feather name="arrow-right" size={15} color="#ffffff"/>
          <Text style={{fontSize: 14, fontFamily: FONT_FAMILY,fontWeight:'800',color:'#ffffff'}}>Continue to Editor</Text>
        </TouchableOpacity>
      </View>

    </View>
  </View>
</Modal>
        {/* Manage Articles Modal — Web */}
        {manageDateKey&&(
          <Modal visible={!!manageDateKey} animationType="slide" onRequestClose={()=>setManageDateKey(null)}>
            <View style={{flex:1,backgroundColor:'#F7F4F0'}}>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:14,backgroundColor:O[400],borderBottomWidth:2,borderBottomColor:O[600]}}>
                <TouchableOpacity onPress={()=>{setManageDateKey(null);setManageDateFilter('all');}} style={{width:36,height:36,borderRadius:8,backgroundColor:'rgba(255,255,255,0.2)',alignItems:'center',justifyContent:'center'}}>
                  <Feather name="x" size={18} color="#ffffff"/>
                </TouchableOpacity>
                <View style={{flex:1,alignItems:'center'}}>
                  <Text style={{fontSize: 16, fontFamily: FONT_FAMILY,fontWeight:'800',color:'#ffffff'}}>Manage Articles</Text>
                  <Text style={{fontSize: 11, fontFamily: FONT_FAMILY,color:'rgba(255,255,255,0.8)',marginTop:1}}>{manageDateKey}</Text>
                </View>
                <View style={{width:36}}/>
              </View>

              <ScrollView contentContainerStyle={{padding:16}} showsVerticalScrollIndicator={false}>
                {(grouped_manage||[]).map((item)=>{
                  const plainTitle=(item.title||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').trim();
                  const plainDesc=(item.description||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').trim();
                  return(
                    <View key={item.id} style={{backgroundColor:'#ffffff',borderRadius:12,padding:16,marginBottom:10,borderWidth:1,borderColor:'#EDE8E1'}}>
                      <Text style={{fontSize: 15, fontFamily: FONT_FAMILY,fontWeight:'800',color:'#111111',lineHeight:21,marginBottom:6}}>{plainTitle||'Untitled'}</Text>
                      {!!plainDesc&&<Text style={{fontSize: 13, fontFamily: FONT_FAMILY,color:'#666666',lineHeight:19,marginBottom:8}} numberOfLines={2}>{plainDesc}</Text>}
                      {item.state&&(
                        <View style={{flexDirection:'row',alignItems:'center',gap:5,alignSelf:'flex-start',backgroundColor:O[50],borderWidth:1,borderColor:O[200],borderRadius:999,paddingHorizontal:10,paddingVertical:3,marginBottom:8}}>
                          <Feather name="map-pin" size={11} color={O[600]}/>
                          <Text style={{fontSize: 11, fontFamily: FONT_FAMILY,fontWeight:'700',color:O[800]}}>{item.state}</Text>
                        </View>
                      )}
                      <View style={{flexDirection:'row',gap:7,flexWrap:'wrap',marginTop:4}}>
                        <TouchableOpacity style={ws.actionBtn} onPress={()=>{setManageDateKey(null);handleView(item);}}><Feather name="eye" size={13} color={O[600]}/><Text style={ws.actionBtnTxt}>View</Text></TouchableOpacity>
                        {isAdmin&&item.status==='pending'&&(
                          <>
                            <TouchableOpacity style={{...ws.actionBtn,backgroundColor:'#F0FDF4',borderColor:'#BBF7D0'}} onPress={()=>handleApprove(item)}><Feather name="check" size={13} color="#16A34A"/><Text style={{...ws.actionBtnTxt,color:'#16A34A'}}>Approve</Text></TouchableOpacity>
                            <TouchableOpacity style={ws.actionBtnDanger} onPress={()=>handleReject(item)}><Feather name="x" size={13} color="#DC2626"/><Text style={ws.actionBtnDangerTxt}>Reject</Text></TouchableOpacity>
                          </>
                        )}
                        {(isAdmin||item.createdBy===currentUser?.email)&&(
                          <TouchableOpacity style={ws.actionBtnDanger} onPress={()=>{setManageDateKey(null);handleDelete(item);}}><Feather name="trash-2" size={13} color="#DC2626"/><Text style={ws.actionBtnDangerTxt}>Delete</Text></TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </Modal>
        )}
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MOBILE LAYOUT
  // ══════════════════════════════════════════════════════════════════════════
   return (
    <View style={{ flex: 1 }}>
      <View style={EPaperStyles.root}>
        {Platform.OS === 'web' && <View style={EPaperStyles.statusBarSpacer} />}
        {/* Top Bar — ek hi common header (components/ModuleMobileHeader.js) */}
        <ModuleMobileHeader
          title="E-Paper"
          navigation={navigation}
          onBack={() => smartGoBack(navigation, 'QuickMenu')}
        />

        {successMsg ? (
          <View style={EPaperStyles.successOverlay}>
            <View style={EPaperStyles.successBox}>
              <Feather name="check-circle" size={18} color="#16a34a" />
              <Text style={EPaperStyles.successBoxText}>{successMsg}</Text>
            </View>
          </View>
        ) : null}

        <ScrollView style={EPaperStyles.scrollView} contentContainerStyle={EPaperStyles.scrollContent} showsVerticalScrollIndicator={false}>

                 {/* Hero Card */}
          <ImageBackground
            source={require('../assets/images/profile-red.png')}
            resizeMode="cover"
            style={EPaperStyles.heroCard}
          >
            <Text style={[EPaperStyles.heroEyebrow, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Digital Newspaper</Text>
            <Text style={[EPaperStyles.heroTitle, fontsLoaded && { fontFamily: 'Roboto_900Black' }]}>E-Paper</Text>
            <Text style={[EPaperStyles.heroSubtitle, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]}>Rich-text articles with images.</Text>
          </ImageBackground>

          {/* Metrics */}
          <View style={EPaperStyles.metricsRow}>
            <View style={[EPaperStyles.metricCard, EPaperStyles.metricPrimary]}>
              <Text style={EPaperStyles.metricValue}>{items.length}</Text>
              <Text style={EPaperStyles.metricLabel}>Articles</Text>
            </View>
            <View style={[EPaperStyles.metricCard, EPaperStyles.metricSecondary]}>
              <Text style={EPaperStyles.metricValue}>{totalViews}</Text>
              <Text style={EPaperStyles.metricLabel}>Views</Text>
            </View>
            <View style={[EPaperStyles.metricCard, EPaperStyles.metricAccent]}>
              <Text style={EPaperStyles.metricValue}>{items.filter(i => i.status === 'pending').length}</Text>
              <Text style={EPaperStyles.metricLabel}>Pending</Text>
            </View>
          </View>

          {/* Articles grouped by date */}
          <View style={EPaperStyles.card}>
            <Text style={EPaperStyles.sectionTitle}>E-Paper Articles</Text>

            {loading ? (
              <Text style={EPaperStyles.loadingText}>Loading…</Text>
            ) : items.length === 0 ? (
              <Text style={EPaperStyles.emptyText}>No e-paper records found.</Text>
            ) : (() => {
              const grouped = {};
              items.forEach(item => {
                const dateKey = item.publishDate || item.createdAt?.slice(0, 10) || 'Unknown';
                if (!grouped[dateKey]) grouped[dateKey] = [];
                grouped[dateKey].push(item);
              });
              const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

              return sortedDates.map(dateKey => {
                const approvedCount = grouped[dateKey].filter(i => i.status === 'approved').length;
                const unpublishedCount = grouped[dateKey].filter(i => i.status !== 'approved').length;
                const isPublished = approvedCount > 0;

                return (
                  <View key={dateKey} style={{ backgroundColor:'#fff', borderWidth:1, borderColor:'#EDE8E1', borderRadius:14, marginBottom:12, overflow:'hidden' }}>

                    {/* Date Header */}
                    <View style={{ flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:14, paddingVertical:12, backgroundColor:'#FEF6EC', borderBottomWidth:1, borderBottomColor:'#FDECD8' }}>
                      <Feather name="calendar" size={13} color="#C8700F" />
                      <Text style={{ fontSize: 13, fontFamily: FONT_FAMILY, fontWeight:'800', color:'#C8700F', flex:1 }}>{dateKey}</Text>
                      {isPublished ? (
                        <TouchableOpacity
                          onPress={async () => { const allItems = grouped[dateKey].filter(i => i.status !== 'approved'); for (const item of allItems) await handleApprove(item); }}
                          style={{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#F0FDF4', borderWidth:1, borderColor:'#BBF7D0', borderRadius:999, paddingHorizontal:10, paddingVertical:3 }}
                        >
                          <View style={{ width:6, height:6, borderRadius:3, backgroundColor:'#22C55E' }} />
                          <Text style={{ fontSize: 11, fontFamily: FONT_FAMILY, fontWeight:'700', color:'#16A34A' }}>{approvedCount} Published</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={async () => { const pendingItems = grouped[dateKey].filter(i => i.status !== 'approved'); for (const item of pendingItems) await handleApprove(item); }}
                          style={{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#FFF7ED', borderWidth:1, borderColor:'#FDECD8', borderRadius:999, paddingHorizontal:10, paddingVertical:3 }}
                        >
                          <View style={{ width:6, height:6, borderRadius:3, backgroundColor:'#DC2626' }} />
                          <Text style={{ fontSize: 11, fontFamily: FONT_FAMILY, fontWeight:'700', color:'#C8700F' }}>{unpublishedCount} Unpublished</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Article Titles */}
                    {grouped[dateKey].map((item, idx) => {
                      const plainTitle = (item.title || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim();
                      const isLast = idx === grouped[dateKey].length - 1;
                      return (
                        <View key={item.id} style={{ flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:14, paddingVertical:10, borderBottomWidth:isLast?0:1, borderBottomColor:'#F5F2EE' }}>
                          <Feather name="file-text" size={13} color="#DC2626" />
                          <Text style={{ flex:1, fontSize: 13, fontFamily: FONT_FAMILY, fontWeight:'600', color:'#333', lineHeight:19 }} numberOfLines={1}>{plainTitle || 'Untitled'}</Text>
                        </View>
                      );
                    })}

                    {/* Bottom Buttons */}
                    <View style={{ flexDirection:'row', gap:8, paddingHorizontal:14, paddingVertical:12, borderTopWidth:1, borderTopColor:'#F5F2EE' }}>
                      <TouchableOpacity
                        style={{ flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5, paddingVertical:9, borderRadius:10, backgroundColor:'#FEF6EC', borderWidth:1, borderColor:'#FBCFA0' }}
                        onPress={() => setManageDateKey(dateKey)}
                      >
                        <Feather name="settings" size={13} color="#C8700F" />
                        <Text style={{ fontSize: 12, fontFamily: FONT_FAMILY, fontWeight:'700', color:'#C8700F' }}>Manage</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5, paddingVertical:9, borderRadius:10, backgroundColor:'#F0FDF4', borderWidth:1, borderColor:'#BBF7D0' }}
                        onPress={async()=>{
                          const user = await UserStore.getCurrentUser();
                          const layouts = Array.isArray(user?.newspaper_layouts) ? user.newspaper_layouts : [];
                          const layout = layouts.find(l => l.publishDate === dateKey);
                          if(layout){
                            navigation.navigate('NewspaperPage', { loadLayout: layout });
                          } else {
                            Alert.alert('Not found', 'No newspaper layout found for this ');
                          }
                        }}
                      >
                        <Feather name="eye" size={13} color="#16A34A" />
                        <Text style={{ fontSize: 12, fontFamily: FONT_FAMILY, fontWeight:'700', color:'#16A34A' }}>View Newspaper</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              });
            })()}
          </View>
        </ScrollView>

        {/* Manage Articles Modal — Mobile */}
        {manageDateKey && (
          <Modal visible={!!manageDateKey} animationType="slide" onRequestClose={() => setManageDateKey(null)}>
            <SafeAreaView style={{ flex:1, backgroundColor:'#DC2626' }}>
              <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:14, backgroundColor:'#DC2626' }}>
                <TouchableOpacity onPress={() => { setManageDateKey(null); setManageDateFilter('all'); }} style={{ width:36, height:36, borderRadius:8, backgroundColor:'rgba(255,255,255,0.2)', alignItems:'center', justifyContent:'center' }}>
                  <Feather name="x" size={18} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex:1, alignItems:'center' }}>
                  <Text style={{ fontSize: 15, fontFamily: FONT_FAMILY, fontWeight:'800', color:'#fff' }}>Manage Articles</Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT_FAMILY, color:'rgba(255,255,255,0.8)', marginTop:1 }}>{manageDateKey}</Text>
                </View>
                <View style={{ width:36 }} />
              </View>

              <ScrollView contentContainerStyle={{ padding:14, backgroundColor:'#F8F8F8' }} style={{ backgroundColor:'#F8F8F8' }} showsVerticalScrollIndicator={false}>
                {(items.filter(i => (i.publishDate || i.createdAt?.slice(0, 10) || 'Unknown') === manageDateKey) || []).map(item => {
                  const plainTitle = (item.title || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim();
                  const plainDesc = (item.description || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim();

                  return (
                    <View key={item.id} style={{ backgroundColor:'#fff', borderRadius:14, padding:14, marginBottom:10, borderWidth:1, borderColor:'#EDE8E1' }}>
                      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <StatusBadge status={item.status} />
                        <Text style={{ fontSize: 11, fontFamily: FONT_FAMILY, color:'#AAAAAA', fontWeight:'500' }}>{item.publishDate || item.createdAt?.slice(0, 10) || ''}</Text>
                      </View>
                      <Text style={{ fontSize: 15, fontFamily: FONT_FAMILY, fontWeight:'800', color:'#111', lineHeight:21, marginBottom:6 }}>{plainTitle || 'Untitled'}</Text>
                      {!!plainDesc && (<Text style={{ fontSize: 12, fontFamily: FONT_FAMILY, color:'#666', lineHeight:18, marginBottom:8 }} numberOfLines={2}>{plainDesc}</Text>)}
                      {item.state && (
                        <View style={{ flexDirection:'row', alignItems:'center', gap:4, alignSelf:'flex-start', backgroundColor:'#FFE8F0', borderWidth:1, borderColor:'#FFB3CC', borderRadius:999, paddingHorizontal:10, paddingVertical:3, marginBottom:8 }}>
                          <Feather name="map-pin" size={11} color="#DC2626" />
                          <Text style={{ fontSize: 11, fontFamily: FONT_FAMILY, fontWeight:'700', color:'#DC2626' }}>{item.state}</Text>
                        </View>
                      )}

                      {/* Action buttons — Edit removed */}
                      <View style={{ flexDirection:'row', gap:6, flexWrap:'wrap', marginTop:4 }}>
                        <TouchableOpacity style={EPaperStyles.actionBtn} onPress={() => { setManageDateKey(null); handleView(item); }}>
                          <Feather name="eye" size={13} color="#DC2626" />
                          <Text style={EPaperStyles.actionBtnText}>View</Text>
                        </TouchableOpacity>
                        {(isAdmin || item.createdBy === currentUser?.email) && (
                          <TouchableOpacity style={EPaperStyles.actionBtnDanger} onPress={() => { setManageDateKey(null); handleDelete(item); }}>
                            <Feather name="trash-2" size={13} color="#DC2626" />
                            <Text style={EPaperStyles.actionBtnDangerText}>Delete</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={EPaperStyles.actionBtn} onPress={() => handleShare(item)}>
                          <Feather name="share-2" size={13} color="#DC2626" />
                          <Text style={EPaperStyles.actionBtnText}>Share</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Admin approve/reject */}
                      {isAdmin && item.status === 'pending' && (
                        <View style={EPaperStyles.adminActionRow}>
                          <TouchableOpacity style={EPaperStyles.approveBtn} onPress={() => handleApprove(item)}>
                            <Feather name="check" size={13} color="#16a34a" />
                            <Text style={EPaperStyles.approveBtnText}>Approve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={EPaperStyles.rejectBtn} onPress={() => handleReject(item)}>
                            <Feather name="x" size={13} color="#DC2626" />
                            <Text style={EPaperStyles.rejectBtnText}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </SafeAreaView>
          </Modal>
        )}

        <ViewModal />
        <Modal
  visible={reporterModal}
  animationType="fade"
  transparent
  onRequestClose={() => setReporterModal(false)}
>
  <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.45)',alignItems:'center',justifyContent:'center',padding:20}}>
    <View style={{backgroundColor:'#ffffff',borderRadius:18,padding:24,width:'100%',maxWidth:440}}>
      <Text style={{fontSize: 16, fontFamily: FONT_FAMILY,fontWeight:'800',color:'#111111',marginBottom:4}}>Reporter Details</Text>
      <Text style={{fontSize: 12, fontFamily: FONT_FAMILY,color:'#888888',marginBottom:16}}>Please confirm before publishing</Text>
      <View style={{height:1,backgroundColor:'#F0EBE4',marginBottom:16}}/>

      <Text style={{fontSize: 12, fontFamily: FONT_FAMILY,fontWeight:'700',color:'#555555',marginBottom:6}}>Reporter Name</Text>
      <View style={{flexDirection:'row',alignItems:'center',gap:8,borderWidth:1.5,borderColor:'#E5DDD5',borderRadius:10,paddingHorizontal:12,paddingVertical:10,marginBottom:14,backgroundColor:'#FAFAFA'}}>
        <Feather name="user" size={14} color="#AAAAAA"/>
        <TextInput value={reporterName} onChangeText={setReporterName} placeholder="fill Your Name" placeholderTextColor="#BBBBBB" style={{flex:1,fontSize: 14, fontFamily: FONT_FAMILY,color:'#111111'}}/>
      </View>

      <Text style={{fontSize: 12, fontFamily: FONT_FAMILY,fontWeight:'700',color:'#555555',marginBottom:6}}>Location / Shehar</Text>
      <View style={{flexDirection:'row',alignItems:'center',gap:8,borderWidth:1.5,borderColor:'#E5DDD5',borderRadius:10,paddingHorizontal:12,paddingVertical:10,marginBottom:14,backgroundColor:'#FAFAFA'}}>
        <Feather name="map-pin" size={14} color="#AAAAAA"/>
        <TextInput value={reporterLocation} onChangeText={setReporterLocation} placeholder="Shehar ya jagah" placeholderTextColor="#BBBBBB" style={{flex:1,fontSize: 14, fontFamily: FONT_FAMILY,color:'#111111'}}/>
      </View>

     {/* Date */}
      <Text style={{fontSize: 12, fontFamily: FONT_FAMILY,fontWeight:'700',color:'#555555',marginBottom:6}}>Publish Date</Text>
      <View style={{flexDirection:'row',alignItems:'center',gap:8,borderWidth:1.5,borderColor:'#E5DDD5',borderRadius:10,paddingHorizontal:12,paddingVertical:10,marginBottom:22,backgroundColor:'#FAFAFA'}}>
        <Feather name="calendar" size={14} color="#AAAAAA"/>
        {Platform.OS==='web' ? (
          <input
            type="date"
            value={reporterDate}
            onChange={e=>setReporterDate(e.target.value)}
            style={{flex:1,fontSize: 14, fontFamily: FONT_FAMILY,color:'#111111',border:'none',outline:'none',backgroundColor:'transparent',cursor:'pointer',width:'100%'}}
          />
        ) : (
          <TextInput
            value={reporterDate}
            onChangeText={setReporterDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#BBBBBB"
            style={{flex:1,fontSize: 14, fontFamily: FONT_FAMILY,color:'#111111'}}
          />
        )}
      </View>

      <View style={{flexDirection:'row',gap:10}}>
        <TouchableOpacity onPress={()=>setReporterModal(false)} style={{flex:1,paddingVertical:11,borderRadius:10,borderWidth:1.5,borderColor:'#E5DDD5',alignItems:'center'}}>
          <Text style={{fontSize: 14, fontFamily: FONT_FAMILY,fontWeight:'700',color:'#888888'}}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={()=>{
            if(!reporterName.trim()){showToast('Reporter name required!','error');return;}
            setReporterModal(false);
            navigation.navigate('NewspaperPage',{reporterName:reporterName.trim(),reporterLocation:reporterLocation.trim(),publishDate:reporterDate});
          }}
          style={{flex:2,paddingVertical:11,borderRadius:10,backgroundColor:'#DC2626',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:7}}
        >
          <Feather name="arrow-right" size={15} color="#ffffff"/>
          <Text style={{fontSize: 14, fontFamily: FONT_FAMILY,fontWeight:'800',color:'#ffffff'}}>Continue to Editor</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
      </View>
    </View>
  );
}