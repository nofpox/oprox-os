import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  Globe,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Layers,
  Award,
  BookMarked,
  FileText,
  Video,
  Code,
  FolderTree,
  AlertCircle,
  X,
  Play
} from 'lucide-react';

export interface AcademyCourse {
  id: string;
  titleEn: string;
  titleAr: string;
  slug: string;
  summaryEn?: string;
  summaryAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  language: 'en' | 'ar' | 'both';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
  estimatedDurationMinutes: number;
  thumbnailUrl?: string;
  priceSar: string;
  currency: string;
  categoryId?: string;
  learningPathId?: string;
  instructorId?: string;
  createdAt: string;
}

export interface AcademyCategory {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  icon?: string;
}

export interface AcademyLearningPath {
  id: string;
  titleEn: string;
  titleAr: string;
  slug: string;
  descriptionEn?: string;
  descriptionAr?: string;
  level: string;
  estimatedHours: number;
}

export interface AcademyEnrollment {
  id: string;
  courseId: string;
  status: string;
  progressPercent: number;
  enrolledAt: string;
  course?: AcademyCourse;
}

export interface CourseDetailPayload {
  course: AcademyCourse;
  instructor?: {
    id: string;
    title: string;
    bio?: string;
    expertiseAreas?: string[];
    rating: string;
    totalStudents: number;
    totalCourses: number;
  };
  modules: Array<{
    id: string;
    titleEn: string;
    titleAr: string;
    descriptionEn?: string;
    descriptionAr?: string;
    displayOrder: number;
    lessons: Array<{
      id: string;
      titleEn: string;
      titleAr: string;
      lessonType: string;
      durationMinutes: number;
      isPreview: boolean;
      resources: Array<{
        id: string;
        titleEn: string;
        titleAr: string;
        resourceType: string;
        resourceUrl: string;
      }>;
    }>;
  }>;
}

export const OproxAcademyWorkspace: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [activeTab, setActiveTab] = useState<'catalog' | 'paths' | 'my-learning'>('catalog');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');

  // Data State
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [categories, setCategories] = useState<AcademyCategory[]>([]);
  const [learningPaths, setLearningPaths] = useState<AcademyLearningPath[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<AcademyEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // Course Detail Modal
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<CourseDetailPayload | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState<string | null>(null);

  const isRtl = lang === 'ar';

  useEffect(() => {
    fetchAcademyData();
  }, [selectedCategory, selectedLevel, selectedLanguage, searchQuery]);

  async function fetchAcademyData() {
    setLoading(true);
    try {
      // Build query string for courses
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (selectedLevel !== 'ALL') params.set('level', selectedLevel);
      if (selectedLanguage !== 'ALL') params.set('language', selectedLanguage);

      const [crsRes, catRes, pathRes, enrRes] = await Promise.all([
        fetch(`/api/academy/courses?${params.toString()}`),
        fetch('/api/academy/categories'),
        fetch('/api/academy/learning-paths'),
        fetch('/api/academy/enrollments/me'),
      ]);

      if (crsRes.ok) {
        const crsData = await crsRes.json();
        setCourses(crsData.courses || []);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
      if (pathRes.ok) {
        const pathData = await pathRes.json();
        setLearningPaths(pathData.learningPaths || []);
      }
      if (enrRes.ok) {
        const enrData = await enrRes.json();
        setMyEnrollments(enrData.enrollments || []);
      }
    } catch (err) {
      console.error('Failed to load Academy data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function openCourseDetail(courseIdOrSlug: string) {
    setLoadingDetail(true);
    setEnrollMessage(null);
    try {
      const res = await fetch(`/api/academy/courses/${courseIdOrSlug}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCourseDetail(data);
      }
    } catch (err) {
      console.error('Failed to fetch course detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleEnroll(courseId: string) {
    setEnrolling(true);
    setEnrollMessage(null);
    try {
      const res = await fetch(`/api/academy/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setEnrollMessage(
          data.isNew
            ? isRtl
              ? 'تم التسجيل في الدورة بنجاح!'
              : 'Enrolled in course successfully!'
            : isRtl
            ? 'أنت مسجل بالفعل في هذه الدورة.'
            : 'You are already enrolled in this course.'
        );
        // Refresh enrollments
        fetchAcademyData();
      } else {
        setEnrollMessage(data.error || 'Failed to enroll.');
      }
    } catch (err) {
      setEnrollMessage('Error enrolling in course.');
    } finally {
      setEnrolling(false);
    }
  }

  const isEnrolled = (courseId: string) =>
    myEnrollments.some((e) => e.courseId === courseId);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="space-y-6 text-slate-100 font-sans pb-12 transition-all duration-200"
    >
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
              <GraduationCap className="w-4 h-4" />
              <span>{isRtl ? 'منصة أوب روكس التعليمية' : 'OPROX ACADEMY OS'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {isRtl ? 'أكاديمية أوب روكس للتعليم الفني والبرمجة' : 'Master Technical & AI Skills'}
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              {isRtl
                ? 'مسارات تعليمية متكاملة لعلوم الحاسب والذكاء الاصطناعي وبناء التطبيقات المتقدمة.'
                : 'Structured learning paths, engineering modules, and practical certifications built natively inside OPROX OS.'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium border border-slate-700 transition-all shadow-sm"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>{lang === 'en' ? 'العربية (Arabic)' : 'English'}</span>
            </button>
          </div>
        </div>

        {/* Main Tabs Navigation */}
        <div className="mt-8 flex items-center gap-2 border-b border-slate-800/80 pt-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'catalog'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{isRtl ? 'دليل الدورات' : 'Course Catalog'}</span>
          </button>

          <button
            onClick={() => setActiveTab('paths')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'paths'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isRtl ? 'المسارات التعليمية' : 'Learning Paths'}</span>
            {learningPaths.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-500/20 text-indigo-300">
                {learningPaths.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('my-learning')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'my-learning'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{isRtl ? 'دوراتي المسجلة' : 'My Enrolled Courses'}</span>
            {myEnrollments.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300">
                {myEnrollments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CATALOG TAB */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Search & Filter Controls */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-3 w-4 h-4 text-slate-400`} />
              <input
                type="text"
                placeholder={isRtl ? 'ابحث عن دورة أو موضوع...' : 'Search courses, subjects, keywords...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-all`}
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">{isRtl ? 'جميع التصنيفات' : 'All Categories'}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {isRtl ? cat.nameAr : cat.nameEn}
                  </option>
                ))}
              </select>

              {/* Level Filter */}
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">{isRtl ? 'جميع المستويات' : 'All Levels'}</option>
                <option value="BEGINNER">{isRtl ? 'مبتدئ' : 'Beginner'}</option>
                <option value="INTERMEDIATE">{isRtl ? 'متوسط' : 'Intermediate'}</option>
                <option value="ADVANCED">{isRtl ? 'متقدم' : 'Advanced'}</option>
              </select>

              {/* Language Filter */}
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">{isRtl ? 'جميع اللغات' : 'All Languages'}</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="both">{isRtl ? 'مزدوج (العربية + الإنجليزية)' : 'Bilingual'}</option>
              </select>
            </div>
          </div>

          {/* Courses Grid or Empty State */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">{isRtl ? 'جاري تحميل الدورات...' : 'Loading course catalog...'}</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800/80 space-y-4 max-w-xl mx-auto">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <BookMarked className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-200">
                {isRtl ? 'لا توجد دورات تعليمية متاحة حالياً' : 'No Courses Found'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isRtl
                  ? 'لم يتم إضافة أي دورات تطابق معايير البحث الحالية في لقاعدة البيانات. يمكنك نشر دورة جديدة من خلال واجهة إدارة الأكاديمية.'
                  : 'No published courses match your query in the database catalog. You can create or publish new courses via the Academy administration API.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const enrolled = isEnrolled(course.id);
                return (
                  <div
                    key={course.id}
                    className="group rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 p-5 flex flex-col justify-between hover:shadow-xl hover:shadow-cyan-500/5"
                  >
                    <div className="space-y-3">
                      {/* Course Badges */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          {course.level}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium uppercase">
                          {course.language}
                        </span>
                      </div>

                      {/* Course Title */}
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                        {isRtl ? course.titleAr || course.titleEn : course.titleEn}
                      </h3>

                      {/* Course Summary */}
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {isRtl
                          ? course.summaryAr || course.summaryEn || course.descriptionAr || course.descriptionEn
                          : course.summaryEn || course.descriptionEn}
                      </p>
                    </div>

                    {/* Course Card Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{course.estimatedDurationMinutes} mins</span>
                      </div>

                      <button
                        onClick={() => openCourseDetail(course.slug || course.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all"
                      >
                        <span>{enrolled ? (isRtl ? 'استعراض' : 'View') : isRtl ? 'التفاصيل' : 'Details'}</span>
                        {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LEARNING PATHS TAB */}
      {activeTab === 'paths' && (
        <div className="space-y-6">
          {learningPaths.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800/80 space-y-4 max-w-xl mx-auto">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-200">
                {isRtl ? 'لا توجد مسارات تعليمية حالياً' : 'No Learning Paths Available'}
              </h3>
              <p className="text-xs text-slate-400">
                {isRtl
                  ? 'سيتم إضافة مسارات تعليمية جديدة تتيح لك التطور من المستويات المبتدئة إلى المتقدمة.'
                  : 'Structured learning paths will appear here to guide your complete skill transformation.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {learningPaths.map((path) => (
                <div
                  key={path.id}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 hover:border-indigo-500/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
                      {path.level}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {path.estimatedHours} {isRtl ? 'ساعة' : 'hours'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    {isRtl ? path.titleAr || path.titleEn : path.titleEn}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isRtl ? path.descriptionAr || path.descriptionEn : path.descriptionEn}
                  </p>

                  <button
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setActiveTab('catalog');
                    }}
                    className="w-full mt-2 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold border border-indigo-500/30 transition-all"
                  >
                    {isRtl ? 'استعراض الدورات المندرجة' : 'Explore Path Courses'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MY LEARNING TAB */}
      {activeTab === 'my-learning' && (
        <div className="space-y-6">
          {myEnrollments.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800/80 space-y-4 max-w-xl mx-auto">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-200">
                {isRtl ? 'لم تقم بالتسجيل في أي دورة بعد' : 'No Active Enrollments'}
              </h3>
              <p className="text-xs text-slate-400">
                {isRtl
                  ? 'استكشف دليل الدورات التعليمية وقم بالتسجيل لتبدأ مسيرتك التطويرية.'
                  : 'Browse our course catalog and enroll in courses to start learning.'}
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all"
              >
                {isRtl ? 'الانتقال إلى دليل الدورات' : 'Explore Course Catalog'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEnrollments.map((enr) => (
                <div
                  key={enr.id}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 hover:border-emerald-500/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                      {enr.status}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isRtl ? 'تاريخ التسجيل: ' : 'Enrolled: '}
                      {new Date(enr.enrolledAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white">
                    {enr.course
                      ? isRtl
                        ? enr.course.titleAr || enr.course.titleEn
                        : enr.course.titleEn
                      : enr.courseId}
                  </h4>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{isRtl ? 'نسبة الإنجاز' : 'Progress'}</span>
                      <span className="font-bold text-emerald-400">{enr.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${enr.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => openCourseDetail(enr.courseId)}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all"
                  >
                    {isRtl ? 'متابعة التعلم' : 'Continue Course'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COURSE DETAIL MODAL */}
      {(selectedCourseDetail || loadingDetail) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            {/* Close button */}
            <button
              onClick={() => setSelectedCourseDetail(null)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {loadingDetail ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <div className="w-8 h-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">{isRtl ? 'جاري تفاصيل الدورة...' : 'Loading course syllabus...'}</p>
              </div>
            ) : selectedCourseDetail ? (
              <>
                {/* Course Header */}
                <div className="space-y-3 pr-8">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold">
                      {selectedCourseDetail.course.level}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-medium uppercase">
                      {selectedCourseDetail.course.language}
                    </span>
                  </div>

                  <h2 className="text-xl md:text-2xl font-extrabold text-white">
                    {isRtl
                      ? selectedCourseDetail.course.titleAr || selectedCourseDetail.course.titleEn
                      : selectedCourseDetail.course.titleEn}
                  </h2>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isRtl
                      ? selectedCourseDetail.course.descriptionAr ||
                        selectedCourseDetail.course.summaryAr ||
                        selectedCourseDetail.course.descriptionEn
                      : selectedCourseDetail.course.descriptionEn || selectedCourseDetail.course.summaryEn}
                  </p>
                </div>

                {/* Enrollment Action & Status */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400">{isRtl ? 'سعر الدورة:' : 'Price:'}</span>
                    <p className="text-base font-bold text-emerald-400">
                      {selectedCourseDetail.course.priceSar === '0'
                        ? isRtl
                          ? 'مجاناً'
                          : 'FREE'
                        : `${selectedCourseDetail.course.priceSar} ${selectedCourseDetail.course.currency}`}
                    </p>
                  </div>

                  <button
                    disabled={enrolling}
                    onClick={() => handleEnroll(selectedCourseDetail.course.id)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 hover:from-cyan-400 hover:to-indigo-500 font-bold text-xs shadow-lg transition-all disabled:opacity-50"
                  >
                    {enrolling
                      ? isRtl
                        ? 'جاري التسجيل...'
                        : 'Enrolling...'
                      : isEnrolled(selectedCourseDetail.course.id)
                      ? isRtl
                        ? 'مسجل بالفعل'
                        : 'Already Enrolled'
                      : isRtl
                      ? 'التسجيل في الدورة الآن'
                      : 'Enroll Now'}
                  </button>
                </div>

                {enrollMessage && (
                  <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>{enrollMessage}</span>
                  </div>
                )}

                {/* Instructor Section */}
                {selectedCourseDetail.instructor && (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {isRtl ? 'المحاضر / مدرب الدورة' : 'Instructor'}
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      {selectedCourseDetail.instructor.title}
                    </h4>
                    {selectedCourseDetail.instructor.bio && (
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {selectedCourseDetail.instructor.bio}
                      </p>
                    )}
                  </div>
                )}

                {/* Modules & Lessons Curriculum */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-cyan-400" />
                    <span>{isRtl ? 'منهج وهيكل الدورة' : 'Course Curriculum'}</span>
                  </h3>

                  {selectedCourseDetail.modules.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      {isRtl ? 'لم يتم إضافة وحدات تعليمية لهذه الدورة بعد.' : 'No modules listed for this course yet.'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedCourseDetail.modules.map((mod, idx) => (
                        <div key={mod.id} className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
                          <h4 className="text-xs font-bold text-slate-200">
                            {isRtl ? `الوحدة ${idx + 1}: ${mod.titleAr || mod.titleEn}` : `Module ${idx + 1}: ${mod.titleEn}`}
                          </h4>

                          {mod.lessons.length > 0 && (
                            <div className="space-y-2 pl-2 border-l border-slate-800">
                              {mod.lessons.map((lsn) => (
                                <div
                                  key={lsn.id}
                                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-slate-900/60 text-slate-300"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{isRtl ? lsn.titleAr || lsn.titleEn : lsn.titleEn}</span>
                                  </div>
                                  <span className="text-[11px] text-slate-500">{lsn.durationMinutes} mins</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default OproxAcademyWorkspace;
