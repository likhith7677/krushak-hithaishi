import Link from 'next/link';
import {Leaf,MapPinned,ShieldCheck,School,ScanLine,BookOpen} from 'lucide-react';
export default function About(){return <>
  <section className="inner-hero"><div className="container"><div className="eyebrow">🌾 OUR ROOTS / ನಮ್ಮ ಕಥೆ</div>
    <h1>Technology rooted in our soil.</h1>
    <p>Krushak Hithaishi is a farmer-first agricultural technology project with Kannada-first navigation and a vision for connected Indian villages.</p>
  </div></section>
  <section className="page-section"><div className="container">
    <div className="content-grid">
      <div className="panel">
        <span className="overline">THE PROJECT</span><h2>Krushak Hithaishi</h2>
        <p className="helper">AI-Powered Crop Disease Screening and Hyper-Local Agricultural Shop Discovery</p>
        <p>Developed as an academic engineering project at <strong>Nagarjuna College of Engineering and Technology, Bengaluru</strong>, Department of Computer Science and Engineering (AI & ML).</p>
        <p>Project guidance: <strong>Dr. Rashmi P Karchi, Professor and HOD, AI & ML</strong>.</p>
        <p>The image-only MobileNetV2 classifier supports 15 categories across tomato, potato and capsicum. This model produces candidate labels, <strong>not confirmed field diagnoses</strong>.</p>
        <Link className="btn btn-green" href="/detect">Try the crop checker →</Link>
      </div>
      <div className="panel">
        <span className="overline">HOW IT HELPS</span>
        <div className="small-list">
          <div className="list-row"><ScanLine size={24}/><div><h3>Real trained AI</h3><p>Runs the team's uploaded MobileNetV2 model using its correct 224×224 RGB input and original ordered class labels.</p></div></div>
          <div className="list-row"><MapPinned size={24}/><div><h3>Village shop ownership</h3><p>Shopkeepers manage their profiles, map pins, products, prices and stock. Verification is performed separately.</p></div></div>
          <div className="list-row"><ShieldCheck size={24}/><div><h3>Transparency and safety</h3><p>Owner-reported stock is not guaranteed, and product approval is not an endorsed treatment.</p></div></div>
          <div className="list-row"><BookOpen size={24}/><div><h3>Research to implementation</h3><p>Project informed by the team's MiDI plant disease detection literature review and its focus on field generalization.</p></div></div>
        </div>
      </div>
    </div>
    <div className="panel" style={{marginTop:24}}>
      <h2>Clear farmer-to-shop workflow</h2>
      <div className="steps-progress"><span className="current">Select crop</span><span>Upload leaf</span><span className="current">Real MobileNetV2 prediction</span><span>Read general guidance</span><span className="current">Find approved nearby shops</span><span>Call / Directions</span></div>
      <div className="steps-progress"><span className="current">Shop owner</span><span>Register account</span><span>Confirm map location</span><span>Add products</span><span className="current">Admin reviews</span><span>Shop appears in directory</span></div>
      <div className="notice-ribbon"><Leaf size={18} style={{verticalAlign:'middle'}}/> This application is an evaluated prototype, not a certified agricultural diagnosis or pesticide recommendation service. The optional EfficientNetB0 tomato model remains disabled for named predictions until its original label mapping is supplied. Weather-driven multimodal AI, verified local treatment advice, and field validation are future work.</div>
    </div>
  </div></section>
</>}
