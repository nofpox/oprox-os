import { db } from '../../db';
import {
  academyProfilesTable,
  instructorProfilesTable,
  academyCategoriesTable,
  academyLearningPathsTable,
  academyCoursesTable,
  academyCourseModulesTable,
  academyLessonsTable,
  academyLessonResourcesTable,
  academyEnrollmentsTable,
  academyLessonProgressTable,
  academyCourseProgressTable,
  academyLearningSessionsTable,
  academyBookmarksTable,
  AcademyProfileRow,
  InstructorProfileRow,
  AcademyCategoryRow,
  AcademyLearningPathRow,
  AcademyCourseRow,
  AcademyCourseModuleRow,
  AcademyLessonRow,
  AcademyLessonResourceRow,
  AcademyEnrollmentRow,
  AcademyLessonProgressRow,
  AcademyCourseProgressRow,
  AcademyLearningSessionRow,
  AcademyBookmarkRow,
} from '../../db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { logStructured } from '../logger';

// In-memory fallback stores for unit testing / non-Postgres environments
const memoryProfiles: AcademyProfileRow[] = [];
const memoryInstructors: InstructorProfileRow[] = [];
const memoryCategories: AcademyCategoryRow[] = [];
const memoryPaths: AcademyLearningPathRow[] = [];
const memoryCourses: AcademyCourseRow[] = [];
const memoryModules: AcademyCourseModuleRow[] = [];
const memoryLessons: AcademyLessonRow[] = [];
const memoryResources: AcademyLessonResourceRow[] = [];
const memoryEnrollments: AcademyEnrollmentRow[] = [];
const memoryLessonProgress: AcademyLessonProgressRow[] = [];
const memoryCourseProgress: AcademyCourseProgressRow[] = [];
const memorySessions: AcademyLearningSessionRow[] = [];
const memoryBookmarks: AcademyBookmarkRow[] = [];

export function clearAcademyMemoryStore(): void {
  memoryProfiles.length = 0;
  memoryInstructors.length = 0;
  memoryCategories.length = 0;
  memoryPaths.length = 0;
  memoryCourses.length = 0;
  memoryModules.length = 0;
  memoryLessons.length = 0;
  memoryResources.length = 0;
  memoryEnrollments.length = 0;
  memoryLessonProgress.length = 0;
  memoryCourseProgress.length = 0;
  memorySessions.length = 0;
  memoryBookmarks.length = 0;
}

// ── Profiles ───────────────────────────────────────────────────────────────

export async function getOrCreateAcademyProfile(
  tenantId: string,
  userId: string,
  data?: { headline?: string; bio?: string; avatarUrl?: string; preferLanguage?: string }
): Promise<AcademyProfileRow> {
  const existingMemory = memoryProfiles.find((p) => p.tenantId === tenantId && p.userId === userId);
  if (existingMemory && !db) return existingMemory;

  if (db) {
    try {
      const rows = await db
        .select()
        .from(academyProfilesTable)
        .where(and(eq(academyProfilesTable.tenantId, tenantId), eq(academyProfilesTable.userId, userId)))
        .limit(1);

      if (rows.length > 0) return rows[0];

      const newId = `acad_prof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date();
      const insertData = {
        id: newId,
        tenantId,
        userId,
        headline: data?.headline || null,
        bio: data?.bio || null,
        avatarUrl: data?.avatarUrl || null,
        preferLanguage: data?.preferLanguage || 'en',
        metadataJson: {},
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(academyProfilesTable).values(insertData as any);
      return insertData as AcademyProfileRow;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_PROFILE_FALLBACK', { error: String(err) });
    }
  }

  // Memory fallback
  let profile = memoryProfiles.find((p) => p.tenantId === tenantId && p.userId === userId);
  if (!profile) {
    const now = new Date();
    profile = {
      id: `acad_prof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      userId,
      headline: data?.headline || null,
      bio: data?.bio || null,
      avatarUrl: data?.avatarUrl || null,
      preferLanguage: data?.preferLanguage || 'en',
      metadataJson: {},
      createdAt: now,
      updatedAt: now,
    };
    memoryProfiles.push(profile);
  }
  return profile;
}

export async function updateAcademyProfile(
  tenantId: string,
  userId: string,
  updates: Partial<{ headline: string; bio: string; avatarUrl: string; preferLanguage: string }>
): Promise<AcademyProfileRow> {
  const profile = await getOrCreateAcademyProfile(tenantId, userId);

  if (db) {
    try {
      const now = new Date();
      await db
        .update(academyProfilesTable)
        .set({ ...updates, updatedAt: now })
        .where(and(eq(academyProfilesTable.tenantId, tenantId), eq(academyProfilesTable.userId, userId)));

      return { ...profile, ...updates, updatedAt: now };
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_PROFILE_UPDATE_FALLBACK', { error: String(err) });
    }
  }

  const memoryIndex = memoryProfiles.findIndex((p) => p.tenantId === tenantId && p.userId === userId);
  if (memoryIndex !== -1) {
    memoryProfiles[memoryIndex] = {
      ...memoryProfiles[memoryIndex],
      ...updates,
      updatedAt: new Date(),
    };
    return memoryProfiles[memoryIndex];
  }
  return { ...profile, ...updates };
}

// ── Instructors ────────────────────────────────────────────────────────────

export async function createInstructorProfile(data: {
  tenantId: string;
  userId: string;
  title: string;
  bio?: string;
  expertiseAreas?: string[];
  socialLinks?: Record<string, string>;
  verificationStatus?: string;
}): Promise<InstructorProfileRow> {
  const id = `inst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: InstructorProfileRow = {
    id,
    tenantId: data.tenantId,
    userId: data.userId,
    title: data.title,
    bio: data.bio || null,
    expertiseAreasJson: data.expertiseAreas || [],
    socialLinksJson: data.socialLinks || {},
    rating: '5.0',
    totalStudents: 0,
    totalCourses: 0,
    verificationStatus: data.verificationStatus || 'VERIFIED',
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(instructorProfilesTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_INSTRUCTOR_FALLBACK', { error: String(err) });
    }
  }

  memoryInstructors.push(row);
  return row;
}

export async function getInstructorProfile(tenantId: string, idOrUserId: string): Promise<InstructorProfileRow | null> {
  if (db) {
    try {
      const byId = await db
        .select()
        .from(instructorProfilesTable)
        .where(and(eq(instructorProfilesTable.tenantId, tenantId), eq(instructorProfilesTable.id, idOrUserId)))
        .limit(1);

      if (byId.length > 0) return byId[0];

      const byUser = await db
        .select()
        .from(instructorProfilesTable)
        .where(and(eq(instructorProfilesTable.tenantId, tenantId), eq(instructorProfilesTable.userId, idOrUserId)))
        .limit(1);

      if (byUser.length > 0) return byUser[0];
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_INSTRUCTOR_FALLBACK', { error: String(err) });
    }
  }

  return (
    memoryInstructors.find((i) => i.tenantId === tenantId && (i.id === idOrUserId || i.userId === idOrUserId)) || null
  );
}

export async function listInstructors(tenantId: string): Promise<InstructorProfileRow[]> {
  if (db) {
    try {
      return await db
        .select()
        .from(instructorProfilesTable)
        .where(eq(instructorProfilesTable.tenantId, tenantId));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_INSTRUCTORS_FALLBACK', { error: String(err) });
    }
  }

  return memoryInstructors.filter((i) => i.tenantId === tenantId);
}

// ── Categories ─────────────────────────────────────────────────────────────

export async function createCategory(data: {
  tenantId: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  descriptionEn?: string;
  descriptionAr?: string;
  icon?: string;
  displayOrder?: number;
}): Promise<AcademyCategoryRow> {
  const id = `acad_cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: AcademyCategoryRow = {
    id,
    tenantId: data.tenantId,
    nameEn: data.nameEn,
    nameAr: data.nameAr,
    slug: data.slug,
    descriptionEn: data.descriptionEn || null,
    descriptionAr: data.descriptionAr || null,
    icon: data.icon || 'BookOpen',
    displayOrder: data.displayOrder ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(academyCategoriesTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_CATEGORY_FALLBACK', { error: String(err) });
    }
  }

  memoryCategories.push(row);
  return row;
}

export async function listCategories(tenantId: string): Promise<AcademyCategoryRow[]> {
  if (db) {
    try {
      return await db
        .select()
        .from(academyCategoriesTable)
        .where(eq(academyCategoriesTable.tenantId, tenantId))
        .orderBy(asc(academyCategoriesTable.displayOrder));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_CATEGORIES_FALLBACK', { error: String(err) });
    }
  }

  return memoryCategories
    .filter((c) => c.tenantId === tenantId)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

// ── Learning Paths ─────────────────────────────────────────────────────────

export async function createLearningPath(data: {
  tenantId: string;
  titleEn: string;
  titleAr: string;
  slug: string;
  descriptionEn?: string;
  descriptionAr?: string;
  level?: string;
  estimatedHours?: number;
}): Promise<AcademyLearningPathRow> {
  const id = `acad_path_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: AcademyLearningPathRow = {
    id,
    tenantId: data.tenantId,
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    slug: data.slug,
    descriptionEn: data.descriptionEn || null,
    descriptionAr: data.descriptionAr || null,
    level: data.level || 'ALL_LEVELS',
    estimatedHours: data.estimatedHours ?? 10,
    isPublished: true,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(academyLearningPathsTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_PATH_FALLBACK', { error: String(err) });
    }
  }

  memoryPaths.push(row);
  return row;
}

export async function listLearningPaths(tenantId: string): Promise<AcademyLearningPathRow[]> {
  if (db) {
    try {
      return await db
        .select()
        .from(academyLearningPathsTable)
        .where(and(eq(academyLearningPathsTable.tenantId, tenantId), eq(academyLearningPathsTable.isPublished, true)));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_PATHS_FALLBACK', { error: String(err) });
    }
  }

  return memoryPaths.filter((p) => p.tenantId === tenantId && p.isPublished);
}

// ── Courses ────────────────────────────────────────────────────────────────

export async function createCourse(data: {
  tenantId: string;
  categoryId?: string;
  learningPathId?: string;
  instructorId?: string;
  titleEn: string;
  titleAr: string;
  slug: string;
  summaryEn?: string;
  summaryAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  language?: string;
  level?: string;
  status?: string;
  estimatedDurationMinutes?: number;
  thumbnailUrl?: string;
  priceSar?: string;
  currency?: string;
}): Promise<AcademyCourseRow> {
  const id = `acad_crs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: AcademyCourseRow = {
    id,
    tenantId: data.tenantId,
    categoryId: data.categoryId || null,
    learningPathId: data.learningPathId || null,
    instructorId: data.instructorId || null,
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    slug: data.slug,
    summaryEn: data.summaryEn || null,
    summaryAr: data.summaryAr || null,
    descriptionEn: data.descriptionEn || null,
    descriptionAr: data.descriptionAr || null,
    language: data.language || 'both',
    level: data.level || 'ALL_LEVELS',
    status: data.status || 'PUBLISHED',
    estimatedDurationMinutes: data.estimatedDurationMinutes ?? 120,
    thumbnailUrl: data.thumbnailUrl || null,
    priceSar: data.priceSar || '0',
    currency: data.currency || 'SAR',
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(academyCoursesTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_COURSE_FALLBACK', { error: String(err) });
    }
  }

  memoryCourses.push(row);
  return row;
}

export async function updateCourse(
  tenantId: string,
  courseId: string,
  data: Partial<AcademyCourseRow>
): Promise<AcademyCourseRow | null> {
  if (db) {
    try {
      const now = new Date();
      await db
        .update(academyCoursesTable)
        .set({ ...data, updatedAt: now })
        .where(and(eq(academyCoursesTable.tenantId, tenantId), eq(academyCoursesTable.id, courseId)));

      const updated = await getCourseBySlugOrId(tenantId, courseId);
      return updated?.course || null;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_UPDATE_COURSE_FALLBACK', { error: String(err) });
    }
  }

  const idx = memoryCourses.findIndex((c) => c.tenantId === tenantId && c.id === courseId);
  if (idx !== -1) {
    memoryCourses[idx] = { ...memoryCourses[idx], ...data, updatedAt: new Date() };
    return memoryCourses[idx];
  }
  return null;
}

export async function listCourses(
  tenantId: string,
  filters?: {
    q?: string;
    category?: string;
    level?: string;
    language?: string;
    learningPathId?: string;
    status?: string;
  }
): Promise<AcademyCourseRow[]> {
  const statusFilter = filters?.status || 'PUBLISHED';

  if (db) {
    try {
      const conditions: any[] = [
        eq(academyCoursesTable.tenantId, tenantId),
        eq(academyCoursesTable.status, statusFilter),
      ];

      if (filters?.category) {
        conditions.push(eq(academyCoursesTable.categoryId, filters.category));
      }
      if (filters?.level && filters.level !== 'ALL') {
        conditions.push(eq(academyCoursesTable.level, filters.level));
      }
      if (filters?.language && filters.language !== 'ALL') {
        conditions.push(eq(academyCoursesTable.language, filters.language));
      }
      if (filters?.learningPathId) {
        conditions.push(eq(academyCoursesTable.learningPathId, filters.learningPathId));
      }

      let query = db
        .select()
        .from(academyCoursesTable)
        .where(and(...conditions))
        .orderBy(desc(academyCoursesTable.createdAt));

      let results = await query;

      if (filters?.q && filters.q.trim()) {
        const term = filters.q.trim().toLowerCase();
        results = results.filter(
          (c) =>
            c.titleEn.toLowerCase().includes(term) ||
            c.titleAr.toLowerCase().includes(term) ||
            (c.summaryEn && c.summaryEn.toLowerCase().includes(term)) ||
            (c.summaryAr && c.summaryAr.toLowerCase().includes(term)) ||
            (c.descriptionEn && c.descriptionEn.toLowerCase().includes(term))
        );
      }

      return results;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_COURSES_FALLBACK', { error: String(err) });
    }
  }

  return memoryCourses.filter((c) => {
    if (c.tenantId !== tenantId) return false;
    if (c.status !== statusFilter) return false;
    if (filters?.category && c.categoryId !== filters.category) return false;
    if (filters?.level && filters.level !== 'ALL' && c.level !== filters.level) return false;
    if (filters?.language && filters.language !== 'ALL' && c.language !== filters.language && c.language !== 'both') return false;
    if (filters?.learningPathId && c.learningPathId !== filters.learningPathId) return false;

    if (filters?.q && filters.q.trim()) {
      const term = filters.q.trim().toLowerCase();
      const matchEn = c.titleEn.toLowerCase().includes(term) || (c.summaryEn && c.summaryEn.toLowerCase().includes(term));
      const matchAr = c.titleAr.toLowerCase().includes(term) || (c.summaryAr && c.summaryAr.toLowerCase().includes(term));
      if (!matchEn && !matchAr) return false;
    }
    return true;
  });
}

export async function getCourseBySlugOrId(tenantId: string, idOrSlug: string) {
  let course: AcademyCourseRow | null = null;

  if (db) {
    try {
      const byId = await db
        .select()
        .from(academyCoursesTable)
        .where(and(eq(academyCoursesTable.tenantId, tenantId), eq(academyCoursesTable.id, idOrSlug)))
        .limit(1);

      if (byId.length > 0) {
        course = byId[0];
      } else {
        const bySlug = await db
          .select()
          .from(academyCoursesTable)
          .where(and(eq(academyCoursesTable.tenantId, tenantId), eq(academyCoursesTable.slug, idOrSlug)))
          .limit(1);
        if (bySlug.length > 0) course = bySlug[0];
      }
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_COURSE_FALLBACK', { error: String(err) });
    }
  }

  if (!course) {
    course =
      memoryCourses.find((c) => c.tenantId === tenantId && (c.id === idOrSlug || c.slug === idOrSlug)) || null;
  }

  if (!course) return null;

  // Fetch Instructor, Modules, Lessons & Resources
  const instructor = course.instructorId ? await getInstructorProfile(tenantId, course.instructorId) : null;
  const modules = await listCourseModules(tenantId, course.id);

  const modulesWithLessons = await Promise.all(
    modules.map(async (mod) => {
      const lessons = await listModuleLessons(tenantId, mod.id);
      const lessonsWithResources = await Promise.all(
        lessons.map(async (lsn) => {
          const resources = await listLessonResources(tenantId, lsn.id);
          return { ...lsn, resources };
        })
      );
      return { ...mod, lessons: lessonsWithResources };
    })
  );

  return {
    course,
    instructor: instructor
      ? {
          id: instructor.id,
          title: instructor.title,
          bio: instructor.bio,
          expertiseAreas: instructor.expertiseAreasJson,
          socialLinks: instructor.socialLinksJson,
          rating: instructor.rating,
          totalStudents: instructor.totalStudents,
          totalCourses: instructor.totalCourses,
        }
      : null,
    modules: modulesWithLessons,
  };
}

// ── Modules, Lessons, Resources ───────────────────────────────────────────

export async function createCourseModule(data: {
  tenantId: string;
  courseId: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  displayOrder?: number;
}): Promise<AcademyCourseModuleRow> {
  const id = `acad_mod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: AcademyCourseModuleRow = {
    id,
    tenantId: data.tenantId,
    courseId: data.courseId,
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    descriptionEn: data.descriptionEn || null,
    descriptionAr: data.descriptionAr || null,
    displayOrder: data.displayOrder ?? 1,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(academyCourseModulesTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_MODULE_FALLBACK', { error: String(err) });
    }
  }

  memoryModules.push(row);
  return row;
}

export async function listCourseModules(tenantId: string, courseId: string): Promise<AcademyCourseModuleRow[]> {
  if (db) {
    try {
      return await db
        .select()
        .from(academyCourseModulesTable)
        .where(and(eq(academyCourseModulesTable.tenantId, tenantId), eq(academyCourseModulesTable.courseId, courseId)))
        .orderBy(asc(academyCourseModulesTable.displayOrder));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_MODULES_FALLBACK', { error: String(err) });
    }
  }

  return memoryModules
    .filter((m) => m.tenantId === tenantId && m.courseId === courseId)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

export async function createLesson(data: {
  tenantId: string;
  moduleId: string;
  courseId: string;
  titleEn: string;
  titleAr: string;
  summaryEn?: string;
  summaryAr?: string;
  lessonType?: string;
  contentEn?: string;
  contentAr?: string;
  durationMinutes?: number;
  videoUrl?: string;
  displayOrder?: number;
  isPreview?: boolean;
}): Promise<AcademyLessonRow> {
  const id = `acad_lsn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: AcademyLessonRow = {
    id,
    tenantId: data.tenantId,
    moduleId: data.moduleId,
    courseId: data.courseId,
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    summaryEn: data.summaryEn || null,
    summaryAr: data.summaryAr || null,
    lessonType: data.lessonType || 'TEXT',
    contentEn: data.contentEn || null,
    contentAr: data.contentAr || null,
    durationMinutes: data.durationMinutes ?? 15,
    videoUrl: data.videoUrl || null,
    displayOrder: data.displayOrder ?? 1,
    isPreview: data.isPreview ?? false,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(academyLessonsTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LESSON_FALLBACK', { error: String(err) });
    }
  }

  memoryLessons.push(row);
  return row;
}

export async function listModuleLessons(tenantId: string, moduleId: string): Promise<AcademyLessonRow[]> {
  if (db) {
    try {
      return await db
        .select()
        .from(academyLessonsTable)
        .where(and(eq(academyLessonsTable.tenantId, tenantId), eq(academyLessonsTable.moduleId, moduleId)))
        .orderBy(asc(academyLessonsTable.displayOrder));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_LESSONS_FALLBACK', { error: String(err) });
    }
  }

  return memoryLessons
    .filter((l) => l.tenantId === tenantId && l.moduleId === moduleId)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

export async function createResource(data: {
  tenantId: string;
  lessonId: string;
  titleEn: string;
  titleAr: string;
  resourceType?: string;
  resourceUrl: string;
  fileSizeBytes?: number;
  displayOrder?: number;
}): Promise<AcademyLessonResourceRow> {
  const id = `acad_res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: AcademyLessonResourceRow = {
    id,
    tenantId: data.tenantId,
    lessonId: data.lessonId,
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    resourceType: data.resourceType || 'LINK',
    resourceUrl: data.resourceUrl,
    fileSizeBytes: data.fileSizeBytes || null,
    displayOrder: data.displayOrder ?? 1,
    createdAt: now,
  };

  if (db) {
    try {
      await db.insert(academyLessonResourcesTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_RESOURCE_FALLBACK', { error: String(err) });
    }
  }

  memoryResources.push(row);
  return row;
}

export async function listLessonResources(tenantId: string, lessonId: string): Promise<AcademyLessonResourceRow[]> {
  if (db) {
    try {
      return await db
        .select()
        .from(academyLessonResourcesTable)
        .where(and(eq(academyLessonResourcesTable.tenantId, tenantId), eq(academyLessonResourcesTable.lessonId, lessonId)))
        .orderBy(asc(academyLessonResourcesTable.displayOrder));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_RESOURCES_FALLBACK', { error: String(err) });
    }
  }

  return memoryResources
    .filter((r) => r.tenantId === tenantId && r.lessonId === lessonId)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

// ── Enrollments ────────────────────────────────────────────────────────────

export async function enrollUserInCourse(tenantId: string, userId: string, courseId: string): Promise<{ enrollment: AcademyEnrollmentRow; isNew: boolean }> {
  // Check duplicate enrollment
  const existing = await getEnrollmentByCourse(tenantId, userId, courseId);
  if (existing) {
    return { enrollment: existing, isNew: false };
  }

  const id = `acad_enr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: AcademyEnrollmentRow = {
    id,
    tenantId,
    userId,
    courseId,
    status: 'ACTIVE',
    progressPercent: 0,
    enrolledAt: now,
    completedAt: null,
    lastAccessedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(academyEnrollmentsTable).values(row as any);
      return { enrollment: row, isNew: true };
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_ENROLLMENT_FALLBACK', { error: String(err) });
    }
  }

  memoryEnrollments.push(row);
  return { enrollment: row, isNew: true };
}

export async function getEnrollmentByCourse(
  tenantId: string,
  userId: string,
  courseId: string
): Promise<AcademyEnrollmentRow | null> {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(academyEnrollmentsTable)
        .where(
          and(
            eq(academyEnrollmentsTable.tenantId, tenantId),
            eq(academyEnrollmentsTable.userId, userId),
            eq(academyEnrollmentsTable.courseId, courseId)
          )
        )
        .limit(1);

      if (rows.length > 0) return rows[0];
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_ENROLLMENT_FALLBACK', { error: String(err) });
    }
  }

  return (
    memoryEnrollments.find((e) => e.tenantId === tenantId && e.userId === userId && e.courseId === courseId) || null
  );
}

export async function getUserEnrollments(tenantId: string, userId: string) {
  let enrollments: AcademyEnrollmentRow[] = [];

  if (db) {
    try {
      enrollments = await db
        .select()
        .from(academyEnrollmentsTable)
        .where(and(eq(academyEnrollmentsTable.tenantId, tenantId), eq(academyEnrollmentsTable.userId, userId)))
        .orderBy(desc(academyEnrollmentsTable.lastAccessedAt));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_USER_ENROLLMENTS_FALLBACK', { error: String(err) });
    }
  }

  if (enrollments.length === 0) {
    enrollments = memoryEnrollments
      .filter((e) => e.tenantId === tenantId && e.userId === userId)
      .sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime());
  }

  // Populate course summaries
  const result = await Promise.all(
    enrollments.map(async (enr) => {
      const courseData = await getCourseBySlugOrId(tenantId, enr.courseId);
      return {
        ...enr,
        course: courseData?.course || null,
      };
    })
  );

  return result;
}

// ── OPROX Academy Phase 2 — Progress Engine & Learner Store ───────────────

export async function recordLessonProgress(data: {
  tenantId: string;
  userId: string;
  courseId: string;
  lessonId: string;
  completed?: boolean;
  lastPositionSeconds?: number;
  notes?: string;
}): Promise<{
  lessonProgress: AcademyLessonProgressRow;
  courseProgress: AcademyCourseProgressRow;
  enrollment: AcademyEnrollmentRow;
}> {
  const { tenantId, userId, courseId, lessonId, completed, lastPositionSeconds, notes } = data;

  // 1. Verify user is enrolled
  const enrollment = await getEnrollmentByCourse(tenantId, userId, courseId);
  if (!enrollment) {
    throw new Error('NOT_ENROLLED: Learner is not enrolled in this course.');
  }

  // 2. Load course details to get all lessons
  const courseData = await getCourseBySlugOrId(tenantId, courseId);
  if (!courseData) {
    throw new Error('COURSE_NOT_FOUND: Course not found.');
  }

  const allLessons: AcademyLessonRow[] = courseData.modules.flatMap((m) => m.lessons);
  const targetLesson = allLessons.find((l) => l.id === lessonId);
  if (!targetLesson) {
    throw new Error('LESSON_NOT_FOUND: Lesson not found in this course.');
  }

  const now = new Date();
  const progressId = `acad_lprog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let updatedLessonProg: AcademyLessonProgressRow;

  if (db) {
    try {
      const existingProgRows = await db
        .select()
        .from(academyLessonProgressTable)
        .where(
          and(
            eq(academyLessonProgressTable.tenantId, tenantId),
            eq(academyLessonProgressTable.userId, userId),
            eq(academyLessonProgressTable.lessonId, lessonId)
          )
        )
        .limit(1);

      if (existingProgRows.length > 0) {
        const existing = existingProgRows[0];
        const isNowCompleted = completed !== undefined ? completed : existing.status === 'COMPLETED';
        const newStatus = isNowCompleted ? 'COMPLETED' : 'IN_PROGRESS';
        const newCompletedAt = isNowCompleted ? (existing.completedAt || now) : null;

        await db
          .update(academyLessonProgressTable)
          .set({
            status: newStatus,
            completedAt: newCompletedAt,
            lastPositionSeconds: lastPositionSeconds !== undefined ? lastPositionSeconds : existing.lastPositionSeconds,
            notes: notes !== undefined ? notes : existing.notes,
            updatedAt: now,
          })
          .where(eq(academyLessonProgressTable.id, existing.id));

        updatedLessonProg = {
          ...existing,
          status: newStatus,
          completedAt: newCompletedAt,
          lastPositionSeconds: lastPositionSeconds !== undefined ? lastPositionSeconds : existing.lastPositionSeconds,
          notes: notes !== undefined ? notes : existing.notes,
          updatedAt: now,
        };
      } else {
        const isCompleted = !!completed;
        const insertProg: AcademyLessonProgressRow = {
          id: progressId,
          tenantId,
          userId,
          enrollmentId: enrollment.id,
          courseId,
          lessonId,
          status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
          completedAt: isCompleted ? now : null,
          lastPositionSeconds: lastPositionSeconds || 0,
          notes: notes || null,
          createdAt: now,
          updatedAt: now,
        };

        await db.insert(academyLessonProgressTable).values(insertProg as any);
        updatedLessonProg = insertProg;
      }
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_RECORD_LESSON_PROGRESS_FALLBACK', { error: String(err) });
    }
  }

  // Fallback / memory sync
  const existingMemIdx = memoryLessonProgress.findIndex(
    (p) => p.tenantId === tenantId && p.userId === userId && p.lessonId === lessonId
  );
  if (existingMemIdx !== -1) {
    const existing = memoryLessonProgress[existingMemIdx];
    const isNowCompleted = completed !== undefined ? completed : existing.status === 'COMPLETED';
    updatedLessonProg = {
      ...existing,
      status: isNowCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: isNowCompleted ? (existing.completedAt || now) : null,
      lastPositionSeconds: lastPositionSeconds !== undefined ? lastPositionSeconds : existing.lastPositionSeconds,
      notes: notes !== undefined ? notes : existing.notes,
      updatedAt: now,
    };
    memoryLessonProgress[existingMemIdx] = updatedLessonProg;
  } else if (!db || !updatedLessonProg!) {
    const isCompleted = !!completed;
    updatedLessonProg = {
      id: progressId,
      tenantId,
      userId,
      enrollmentId: enrollment.id,
      courseId,
      lessonId,
      status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: isCompleted ? now : null,
      lastPositionSeconds: lastPositionSeconds || 0,
      notes: notes || null,
      createdAt: now,
      updatedAt: now,
    };
    memoryLessonProgress.push(updatedLessonProg);
  }

  // 3. Compute overall course progress
  const allUserProgressForCourse = await getCourseLessonProgressRows(tenantId, userId, courseId);
  const completedLessonIds = new Set(
    allUserProgressForCourse.filter((p) => p.status === 'COMPLETED').map((p) => p.lessonId)
  );

  const totalLessonsCount = allLessons.length;
  const completedLessonsCount = completedLessonIds.size;
  const progressPercent =
    totalLessonsCount > 0 ? Math.min(100, Math.round((completedLessonsCount / totalLessonsCount) * 100)) : 0;
  const isCourseCompleted = progressPercent === 100;

  // 4. Update Course Progress and Enrollment Records
  let updatedCourseProg: AcademyCourseProgressRow;
  const courseProgId = `acad_cprog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (db) {
    try {
      const existingCProgRows = await db
        .select()
        .from(academyCourseProgressTable)
        .where(
          and(
            eq(academyCourseProgressTable.tenantId, tenantId),
            eq(academyCourseProgressTable.userId, userId),
            eq(academyCourseProgressTable.courseId, courseId)
          )
        )
        .limit(1);

      if (existingCProgRows.length > 0) {
        const existingCProg = existingCProgRows[0];
        updatedCourseProg = {
          ...existingCProg,
          completedLessonsCount,
          totalLessonsCount,
          progressPercent,
          lastLessonId: lessonId,
          status: isCourseCompleted ? 'COMPLETED' : 'IN_PROGRESS',
          lastAccessedAt: now,
          completedAt: isCourseCompleted ? (existingCProg.completedAt || now) : null,
          updatedAt: now,
        };

        await db
          .update(academyCourseProgressTable)
          .set({
            completedLessonsCount,
            totalLessonsCount,
            progressPercent,
            lastLessonId: lessonId,
            status: updatedCourseProg.status,
            lastAccessedAt: now,
            completedAt: updatedCourseProg.completedAt,
            updatedAt: now,
          })
          .where(eq(academyCourseProgressTable.id, existingCProg.id));
      } else {
        updatedCourseProg = {
          id: courseProgId,
          tenantId,
          userId,
          enrollmentId: enrollment.id,
          courseId,
          completedLessonsCount,
          totalLessonsCount,
          progressPercent,
          lastLessonId: lessonId,
          status: isCourseCompleted ? 'COMPLETED' : 'IN_PROGRESS',
          startedAt: now,
          lastAccessedAt: now,
          completedAt: isCourseCompleted ? now : null,
          createdAt: now,
          updatedAt: now,
        };

        await db.insert(academyCourseProgressTable).values(updatedCourseProg as any);
      }

      // Update Enrollment Record
      await db
        .update(academyEnrollmentsTable)
        .set({
          progressPercent,
          status: isCourseCompleted ? 'COMPLETED' : 'ACTIVE',
          completedAt: isCourseCompleted ? (enrollment.completedAt || now) : null,
          lastAccessedAt: now,
          updatedAt: now,
        })
        .where(eq(academyEnrollmentsTable.id, enrollment.id));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_COURSE_PROGRESS_UPDATE_FALLBACK', { error: String(err) });
    }
  }

  // Memory fallback sync for course progress & enrollment
  const memCProgIdx = memoryCourseProgress.findIndex(
    (cp) => cp.tenantId === tenantId && cp.userId === userId && cp.courseId === courseId
  );
  if (memCProgIdx !== -1) {
    memoryCourseProgress[memCProgIdx] = {
      ...memoryCourseProgress[memCProgIdx],
      completedLessonsCount,
      totalLessonsCount,
      progressPercent,
      lastLessonId: lessonId,
      status: isCourseCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      lastAccessedAt: now,
      completedAt: isCourseCompleted ? (memoryCourseProgress[memCProgIdx].completedAt || now) : null,
      updatedAt: now,
    };
    updatedCourseProg = memoryCourseProgress[memCProgIdx];
  } else if (!updatedCourseProg!) {
    updatedCourseProg = {
      id: courseProgId,
      tenantId,
      userId,
      enrollmentId: enrollment.id,
      courseId,
      completedLessonsCount,
      totalLessonsCount,
      progressPercent,
      lastLessonId: lessonId,
      status: isCourseCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      startedAt: now,
      lastAccessedAt: now,
      completedAt: isCourseCompleted ? now : null,
      createdAt: now,
      updatedAt: now,
    };
    memoryCourseProgress.push(updatedCourseProg);
  }

  const memEnrIdx = memoryEnrollments.findIndex((e) => e.id === enrollment.id);
  const updatedEnrollment: AcademyEnrollmentRow = {
    ...enrollment,
    progressPercent,
    status: isCourseCompleted ? 'COMPLETED' : 'ACTIVE',
    completedAt: isCourseCompleted ? (enrollment.completedAt || now) : null,
    lastAccessedAt: now,
    updatedAt: now,
  };
  if (memEnrIdx !== -1) {
    memoryEnrollments[memEnrIdx] = updatedEnrollment;
  }

  // Record activity session
  await recordLearningSession({
    tenantId,
    userId,
    courseId,
    lessonId,
    durationMinutes: Math.max(1, Math.round((targetLesson.durationMinutes || 15) / 3)),
    activityType: completed ? 'LESSON_COMPLETE' : 'LESSON_VIEW',
  });

  return {
    lessonProgress: updatedLessonProg!,
    courseProgress: updatedCourseProg!,
    enrollment: updatedEnrollment,
  };
}

export async function getCourseLessonProgressRows(
  tenantId: string,
  userId: string,
  courseId: string
): Promise<AcademyLessonProgressRow[]> {
  if (db) {
    try {
      return await db
        .select()
        .from(academyLessonProgressTable)
        .where(
          and(
            eq(academyLessonProgressTable.tenantId, tenantId),
            eq(academyLessonProgressTable.userId, userId),
            eq(academyLessonProgressTable.courseId, courseId)
          )
        );
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_LESSON_PROGRESS_FALLBACK', { error: String(err) });
    }
  }

  return memoryLessonProgress.filter(
    (p) => p.tenantId === tenantId && p.userId === userId && p.courseId === courseId
  );
}

export async function getCourseProgress(
  tenantId: string,
  userId: string,
  courseId: string
): Promise<{
  courseProgress: AcademyCourseProgressRow | null;
  lessonProgressList: AcademyLessonProgressRow[];
  completedLessonIds: string[];
  totalLessonsCount: number;
  completedLessonsCount: number;
  progressPercent: number;
  lastLessonId: string | null;
}> {
  const courseData = await getCourseBySlugOrId(tenantId, courseId);
  const allLessons = courseData ? courseData.modules.flatMap((m) => m.lessons) : [];
  const lessonProgressList = await getCourseLessonProgressRows(tenantId, userId, courseId);

  const completedLessonIds = lessonProgressList
    .filter((p) => p.status === 'COMPLETED')
    .map((p) => p.lessonId);

  let courseProgress: AcademyCourseProgressRow | null = null;

  if (db) {
    try {
      const rows = await db
        .select()
        .from(academyCourseProgressTable)
        .where(
          and(
            eq(academyCourseProgressTable.tenantId, tenantId),
            eq(academyCourseProgressTable.userId, userId),
            eq(academyCourseProgressTable.courseId, courseId)
          )
        )
        .limit(1);

      if (rows.length > 0) courseProgress = rows[0];
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_COURSE_PROGRESS_FALLBACK', { error: String(err) });
    }
  }

  if (!courseProgress) {
    courseProgress =
      memoryCourseProgress.find(
        (cp) => cp.tenantId === tenantId && cp.userId === userId && cp.courseId === courseId
      ) || null;
  }

  const totalLessonsCount = allLessons.length;
  const completedLessonsCount = completedLessonIds.length;
  const progressPercent =
    totalLessonsCount > 0 ? Math.min(100, Math.round((completedLessonsCount / totalLessonsCount) * 100)) : 0;
  const lastLessonId =
    courseProgress?.lastLessonId ||
    (lessonProgressList.length > 0 ? lessonProgressList[lessonProgressList.length - 1].lessonId : null) ||
    (allLessons.length > 0 ? allLessons[0].id : null);

  return {
    courseProgress,
    lessonProgressList,
    completedLessonIds,
    totalLessonsCount,
    completedLessonsCount,
    progressPercent,
    lastLessonId,
  };
}

export async function recordLearningSession(data: {
  tenantId: string;
  userId: string;
  courseId: string;
  lessonId?: string;
  durationMinutes?: number;
  activityType?: string;
}): Promise<AcademyLearningSessionRow> {
  const id = `acad_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const row: AcademyLearningSessionRow = {
    id,
    tenantId: data.tenantId,
    userId: data.userId,
    courseId: data.courseId,
    lessonId: data.lessonId || null,
    durationMinutes: data.durationMinutes || 1,
    activityType: data.activityType || 'LESSON_VIEW',
    createdAt: new Date(),
  };

  if (db) {
    try {
      await db.insert(academyLearningSessionsTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_RECORD_SESSION_FALLBACK', { error: String(err) });
    }
  }

  memorySessions.push(row);
  return row;
}

export async function toggleBookmark(
  tenantId: string,
  userId: string,
  courseId: string,
  lessonId: string,
  note?: string
): Promise<{ bookmarked: boolean; bookmark: AcademyBookmarkRow | null }> {
  if (db) {
    try {
      const existing = await db
        .select()
        .from(academyBookmarksTable)
        .where(
          and(
            eq(academyBookmarksTable.tenantId, tenantId),
            eq(academyBookmarksTable.userId, userId),
            eq(academyBookmarksTable.lessonId, lessonId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db.delete(academyBookmarksTable).where(eq(academyBookmarksTable.id, existing[0].id));
        return { bookmarked: false, bookmark: null };
      }

      const id = `acad_bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newBm: AcademyBookmarkRow = {
        id,
        tenantId,
        userId,
        courseId,
        lessonId,
        note: note || null,
        createdAt: new Date(),
      };

      await db.insert(academyBookmarksTable).values(newBm as any);
      return { bookmarked: true, bookmark: newBm };
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_TOGGLE_BOOKMARK_FALLBACK', { error: String(err) });
    }
  }

  const existingIdx = memoryBookmarks.findIndex(
    (b) => b.tenantId === tenantId && b.userId === userId && b.lessonId === lessonId
  );

  if (existingIdx !== -1) {
    memoryBookmarks.splice(existingIdx, 1);
    return { bookmarked: false, bookmark: null };
  }

  const newBm: AcademyBookmarkRow = {
    id: `acad_bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId,
    userId,
    courseId,
    lessonId,
    note: note || null,
    createdAt: new Date(),
  };
  memoryBookmarks.push(newBm);
  return { bookmarked: true, bookmark: newBm };
}

export async function getUserBookmarks(
  tenantId: string,
  userId: string,
  courseId?: string
): Promise<AcademyBookmarkRow[]> {
  if (db) {
    try {
      const conditions = [
        eq(academyBookmarksTable.tenantId, tenantId),
        eq(academyBookmarksTable.userId, userId),
      ];
      if (courseId) conditions.push(eq(academyBookmarksTable.courseId, courseId));

      return await db
        .select()
        .from(academyBookmarksTable)
        .where(and(...conditions))
        .orderBy(desc(academyBookmarksTable.createdAt));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_BOOKMARKS_FALLBACK', { error: String(err) });
    }
  }

  return memoryBookmarks.filter(
    (b) => b.tenantId === tenantId && b.userId === userId && (!courseId || b.courseId === courseId)
  );
}

export async function getLearnerDashboardSummary(tenantId: string, userId: string) {
  const enrollments = await getUserEnrollments(tenantId, userId);

  const enrichedEnrollments = await Promise.all(
    enrollments.map(async (enr) => {
      const prog = await getCourseProgress(tenantId, userId, enr.courseId);
      return {
        ...enr,
        completedLessonsCount: prog.completedLessonsCount,
        totalLessonsCount: prog.totalLessonsCount,
        progressPercent: prog.progressPercent,
        lastLessonId: prog.lastLessonId,
        completedLessonIds: prog.completedLessonIds,
      };
    })
  );

  const inProgressCourses = enrichedEnrollments.filter((e) => e.progressPercent < 100 && e.status !== 'CANCELLED');
  const completedCourses = enrichedEnrollments.filter((e) => e.progressPercent === 100 || e.status === 'COMPLETED');

  const continueLearning = inProgressCourses.length > 0 ? inProgressCourses[0] : null;

  let recentSessions: AcademyLearningSessionRow[] = [];
  if (db) {
    try {
      recentSessions = await db
        .select()
        .from(academyLearningSessionsTable)
        .where(
          and(
            eq(academyLearningSessionsTable.tenantId, tenantId),
            eq(academyLearningSessionsTable.userId, userId)
          )
        )
        .orderBy(desc(academyLearningSessionsTable.createdAt))
        .limit(10);
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_SESSIONS_FALLBACK', { error: String(err) });
    }
  }

  if (recentSessions.length === 0) {
    recentSessions = memorySessions
      .filter((s) => s.tenantId === tenantId && s.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }

  const bookmarks = await getUserBookmarks(tenantId, userId);

  const totalEnrolled = enrichedEnrollments.length;
  const completedCount = completedCourses.length;
  const inProgressCount = inProgressCourses.length;
  const averageProgress =
    totalEnrolled > 0
      ? Math.round(enrichedEnrollments.reduce((sum, e) => sum + e.progressPercent, 0) / totalEnrolled)
      : 0;

  return {
    stats: {
      totalEnrolled,
      completedCount,
      inProgressCount,
      averageProgress,
    },
    continueLearning,
    inProgressCourses,
    completedCourses,
    recentActivity: recentSessions,
    bookmarks,
  };
}