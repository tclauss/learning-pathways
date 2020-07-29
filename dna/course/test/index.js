/// NB: The tryorama config patterns are still not quite stabilized.
/// See the tryorama README [https://github.com/holochain/tryorama]
/// for a potentially more accurate example


const path = require("path");

const {
  Orchestrator,
  Config,
  combine,
  singleConductor,
  localOnly,
  tapeExecutor
} = require("@holochain/tryorama");

process.on("unhandledRejection", error => {
  // Will print "unhandledRejection err is not defined"
  console.error("got unhandledRejection:", error);
});

const dnaPath = path.join(__dirname, "../dist/course.dna.json");

const orchestrator = new Orchestrator({
  middleware: combine(
    tapeExecutor(require("tape")),
    localOnly
  )
});

const dna = Config.dna(dnaPath, "course_dna");
const conductorConfig = Config.gen(
  { course_dna: dna },
  {
    network: {
      type: "sim2h",
      sim2h_url: "ws://localhost:9000"
    },
    logger: Config.logger({ type: "error" }),
  }
);

function createCourse(title, timestamp) {
  return (caller) => 
    caller.call("course_dna", "courses", "create_course", {
      title,
      timestamp,
    })
};

function updateCourse(title, sectionsAddresses, courseAnchorAddress) {
  return (caller) =>
  caller.call("course_dna", "courses", "update_course", {
    title,
    sections_addresses: sectionsAddresses,
    course_anchor_address: courseAnchorAddress,
  }) 
};

function deleteCourse(courseAnchorAddress) {
  return (caller) =>
    caller.call("course_dna", "courses", "delete_course", {
      course_anchor_address: courseAnchorAddress,
    })
};

function getLatestCouseEntry(courseAnchorAddress) {
  return (caller) =>
    caller.call("course_dna", "courses", "get_latest_course_entry", {
      course_anchor_address: courseAnchorAddress,
    })
};

function getMyCourses() {
  return (caller) =>
    caller.call("course_dna", "courses", "get_my_courses", {})
};

function enrolInCourse(courseAnchorAddress) {
  return (caller) =>
    caller.call("course_dna", "courses", "enrol_in_course", {
      course_anchor_address: courseAnchorAddress,
    })
};

function getMyEnrolledCourse() {
  return (caller) =>
    caller.call("course_dna", "courses", "get_my_enrolled_courses", {})
};

function getAllStudents(courseAnchorAddress) {
  return (caller) =>
    caller.call("course_dna", "courses", "get_all_students", {
      course_anchor_address: courseAnchorAddress,
    })
};

function createSection(title, courseAnchorAddress, timestamp) {
  return (caller) =>
  caller.call("course_dna", "courses", "create_section", {
    title,
    course_anchor_address: courseAnchorAddress,
    timestamp,
  })
};

function updateSection(title, sectionAnchorAddress) {
  return (caller) =>
  caller.call("course_dna", "courses", "update_section", {
    title,
    section_anchor_address: sectionAnchorAddress,
  })
};

function deleteSection(sectionAnchorAddress) {
  return (caller) =>
    caller.call("course_dna", "courses", "delete_section", {
      section_anchor_address: sectionAnchorAddress,
    })
};

function getLatestSectionEntry(sectionAnchorAddress) {
  return (caller) =>
    caller.call("course_dna", "courses", "get_latest_section_entry", {
      section_anchor_address: sectionAnchorAddress,
    })
};

function createContent(name, sectionAnchorAddress, url, timestamp, description) {
  return (caller) =>
  caller.call("course_dna", "courses", "create_content", {
    name,
    section_anchor_address: sectionAnchorAddress,
    url,
    timestamp,
    description,
  })
};

function updateContent(contentAddress, name, url, description) {
  return (caller) =>
  caller.call("course_dna", "courses", "update_content", {
    content_address: contentAddress,
    name,
    url,
    description,
  })
};

function deleteContent(contentAddress) {
  return (caller) =>
    caller.call("course_dna", "courses", "delete_content", {
      content_address: contentAddress,
    })
};

function getContents(sectionAnchorAddress) {
  return (caller) =>
    caller.call("course_dna", "courses", "get_contents", {
      section_anchor_address: sectionAnchorAddress,
    })
};



/*******  CREATE_COURSE & GET_LATEST_COURSE_ENTRY *********/
orchestrator.registerScenario("Scenario1: Create new course and get latest", async (s, t) => {
  const { alice, bob } = await s.players(
    { alice: conductorConfig, bob: conductorConfig },
    true
  );
  const course_addr = await createCourse("course test 1", 123)(alice);
  console.log(course_addr);
  t.ok(course_addr.Ok);

  await s.consistency();

  const course = await getLatestCouseEntry(course_addr.Ok)(bob);
  console.log("course");
  console.log(course);
  t.deepEqual(course.Ok, {
    title: "course test 1",
    timestamp: 123,
    teacher_address: alice.instance("course_dna").agentAddress,
    sections: [],
    anchor_address: course_addr.Ok,
  });
  // Wait for all network activity to settle
  await s.consistency();
});

/*********** UPDATE_COURSE ********/
orchestrator.registerScenario("Scenario2: Update course title", async (s, t) => {
  const { alice, bob } = await s.players(
    { alice: conductorConfig, bob: conductorConfig },
    true
  );
  const course_addr = await createCourse("new course test for update test", 123)(alice);
  const course_update_addrss = await updateCourse("course title updated", [], course_addr.Ok)(alice);
  await s.consistency();
  const course = await getLatestCouseEntry(course_addr.Ok)(bob);
  t.deepEqual(course.Ok, {
    title: "course title updated",
    timestamp: 123,
    teacher_address: alice.instance("course_dna").agentAddress,
    sections: [],
    anchor_address: course_update_addrss.Ok
  });
});

/*********** DELETE_COURSE ********/
orchestrator.registerScenario("Scenario3: Delete course", async (s, t) => {
  const { alice, bob } = await s.players(
    { alice: conductorConfig, bob: conductorConfig },
    true
  );
  const course_addr = await createCourse("new course test for delete scenario", 123)(alice);
  await s.consistency();

  const delete_result = await deleteCourse(course_addr.Ok)(alice);
  await s.consistency();
  
  console.log("deleted");
  console.log(delete_result);
  t.ok(delete_result.Ok);

  const course = await getLatestCouseEntry(course_addr.Ok)(bob);
  console.log("course");
  console.log(course);
  t.deepEqual(course.Ok, null);
  await s.consistency();

});

/******** CREATE_SECTION & GET_LATEST_SECTION_ENTRY **********/
orchestrator.registerScenario("Scenario4: Create new Section for a Course", async (s, t) => {
  const { alice, bob } = await s.players(
    { alice: conductorConfig, bob: conductorConfig },
    true
  );

  const course_addr = await createCourse("course for scenario 4", 123)(alice);
  console.log(course_addr);
  t.ok(course_addr.Ok);

  await s.consistency();
  // Alice can create a module for course because she is the owner
  const new_section_addr = await createSection("section 1 for course 1", course_addr.Ok, 456)(alice);

  console.log(new_section_addr);
  t.ok(new_section_addr.Ok);
  await s.consistency();

  // Bob can not create a module for course, because he is not the owner of course
  const fail_add_module_addr = await createSection("section 1 for course 1 by bob", course_addr.Ok, 456)(bob);

  console.log(fail_add_module_addr);
  t.error(fail_add_module_addr.Ok);
  await s.consistency();

  const sectionResult = await getLatestSectionEntry(new_section_addr.Ok)(alice);
  console.log(sectionResult);
  t.deepEqual(sectionResult.Ok, {
    title: "section 1 for course 1",
    course_address: course_addr.Ok,
    timestamp: 456,
    anchor_address: new_section_addr.Ok
  });
  await s.consistency();
});

/********* GET_MY_COURSES *********/
orchestrator.registerScenario("Scenario5: Get All My Courses", async (s, t) => {
  const { alice, bob } = await s.players(
    { alice: conductorConfig, bob: conductorConfig },
    true
  );
  const course_addr_1 = await createCourse("course for scenario 5-1", 123)(alice);
  console.log(course_addr_1);
  t.ok(course_addr_1.Ok);

  await s.consistency();

  const course_addr_2 = await createCourse("course for scenario 5-2", 1234)(alice);
  console.log(course_addr_2);
  t.ok(course_addr_2.Ok);

  await s.consistency();


  const all_courses_alice = await getMyCourses()(alice);
  t.true(all_courses_alice.Ok[0] != null);
  t.true(all_courses_alice.Ok[1] != null);

  const all_courses_bob = await getMyCourses()(bob);
  t.true(all_courses_bob.Ok[0] == null);

  await s.consistency();

});


/********* CREATE_CONTENT ********/
orchestrator.registerScenario("Scenario6: Create new Content for a Section", async (s, t) => {
  const { alice, bob } = await s.players(
    { alice: conductorConfig, bob: conductorConfig },
    true
  );

  const course_addr = await createCourse("course for scenario 6", 123)(alice);
  console.log(course_addr);
  t.ok(course_addr.Ok);

  await s.consistency();
  const section_addr = await createSection("section 1 for course 1", course_addr.Ok, 456)(alice);

  console.log(section_addr);
  t.ok(section_addr.Ok);
  await s.consistency();

  const content_addr = await createContent(
    "content 1 for module 1",
    section_addr.Ok,
     "https://youtube.com",
     789,
    "Holochain Intro"
  )(alice);

  console.log(content_addr);
  t.ok(content_addr.Ok);
  await s.consistency();
});


/********* GET_CONTENTS *******/
orchestrator.registerScenario("Scenario7: Get all contents of a module", async (s, t) => {
  const { alice, bob } = await s.players(
    { alice: conductorConfig, bob: conductorConfig },
    true
  );
  const course_addr = await createCourse("course for scenario 7", 123)(alice);
  console.log(course_addr);
  t.ok(course_addr.Ok);

  await s.consistency();
  // Alice can create a section for course because she is the owner
  const section_addr = await createSection("section 1 for course 1", course_addr.Ok, 456)(alice);

  console.log(section_addr);
  t.ok(section_addr.Ok);
  await s.consistency();

  const content_addr_1 = await createContent(
    "content 1 for module 1",
    section_addr.Ok,
    "https://youtube.com",
    789,
    "Holochain Intro"
  )(alice);

  console.log(content_addr_1);
  t.ok(content_addr_1.Ok);
  await s.consistency();

  const content_addr_2 = await createContent(
    "content 2 for module 1",
    section_addr.Ok,
    "https://youtube.com",
    7892,
    "Holochain Intro-2"
  )(alice);

  console.log(content_addr_2);
  t.ok(content_addr_2.Ok);
  await s.consistency();


  const all_contents_of_section_1 = await getContents(section_addr.Ok)(alice);

  t.true(all_contents_of_section_1.Ok[0] != null);
  t.true(all_contents_of_section_1.Ok[1] != null);

  await s.consistency();
});


/********* DELETE_CONTENT & GET_CONTENTS **********/
orchestrator.registerScenario("Scenario8: delete content from module", async (s, t) => {
  const { alice, bob } = await s.players(
    { alice: conductorConfig, bob: conductorConfig },
    true
  );
  const course_addr = await createCourse("course for scenario 8", 123)(alice);
  console.log(course_addr);
  t.ok(course_addr.Ok);

  await s.consistency();
  // Alice can create a module for course because she is the owner
  const section_addr = await createSection("section 1 for course 1", course_addr.Ok, 456)(alice);

  console.log(section_addr);
  t.ok(section_addr.Ok);
  await s.consistency();

  const content_addr_1 = await createContent(
    "content 1 for module 1",
    section_addr.Ok,
    "https://youtube.com",
    789,
    "Holochain Intro"
  )(alice);

  console.log(content_addr_1);
  t.ok(content_addr_1.Ok);
  await s.consistency();

  const content_addr_2 = await createContent(
    "content 2 for module 1",
    section_addr.Ok,
    "https://youtube.com",
    7892,
    "Holochain Intro-2"
  )(alice);

  console.log(content_addr_2);
  t.ok(content_addr_2.Ok);
  await s.consistency();

  const all_contents_of_section_1 = await getContents(section_addr.Ok)(alice);

  t.true(all_contents_of_section_1.Ok[0] != null);
  t.true(all_contents_of_section_1.Ok[1] != null);
  await s.consistency();

  const delete_content = await deleteContent(content_addr_1.Ok)(alice)
  
  console.log("delete_content");
  console.log(delete_content);
  t.ok(delete_content.Ok);

  await s.consistency();

  const all_contents_of_section_1_again = await getContents(section_addr.Ok)(alice);

  t.true(all_contents_of_section_1_again.Ok[0] != null);
  t.true(all_contents_of_section_1_again.Ok[1] == null);

  await s.consistency();
});

/***** DELETE_SECTION ***********/
orchestrator.registerScenario(
  "Scenario9: delete module from course",
  async (s, t) => {
    const { alice, bob } = await s.players(
      { alice: conductorConfig, bob: conductorConfig },
      true
    );

    const course_addr = await createCourse("course for scenario 9: debugging purpose", 123)(alice);
    console.log("course_addr");
    console.log(course_addr);
    t.ok(course_addr.Ok);

    await s.consistency();
    // Alice can create a module for course because she is the owner
    const section_addr = await createSection("section 1 for course 1", course_addr.Ok, 456)(alice);

    console.log(section_addr);
    t.ok(section_addr.Ok);
    await s.consistency();

    const courseResult = await getMyCourses()(alice);
    console.log("get_my_courses");
    console.log(courseResult.Ok);
    t.true(courseResult.Ok[0] != null);
    await s.consistency();

    console.log("get_latest_course_entry");
    const course_again = await getLatestCouseEntry(course_addr.Ok)(alice)
    console.log(course_again.Ok);
    await s.consistency();

    const content_addr_1 = await createContent(
      "content 1 for module 1",
      section_addr.Ok,
      "https://youtube.com",
      7891,
      "Holochain Intro-Video"
      )(alice);
    console.log(content_addr_1);
    t.ok(content_addr_1.Ok);
    await s.consistency();

    const content_addr_2 = await createContent(
      "content 2 for module 1",
      section_addr.Ok,
      "https://soundclould.com",
      7892,
      "Holochain Intro-Sound"
      )(alice);

    console.log(content_addr_2);
    t.ok(content_addr_2.Ok);
    await s.consistency();

    const all_contents_of_module_1 = await getContents(section_addr.Ok)(alice);

    t.true(all_contents_of_module_1.Ok[0] != null);
    t.true(all_contents_of_module_1.Ok[1] != null);
    await s.consistency();

    const delete_content = await deleteContent(content_addr_1.Ok)(alice)
    console.log("delete_content");
    console.log(delete_content);
    t.ok(delete_content.Ok);

    await s.consistency();

    const all_contents_of_section_1_again = await getContents(section_addr.Ok)(alice);

    t.true(all_contents_of_section_1_again.Ok[0] != null);
    t.true(all_contents_of_section_1_again.Ok[1] == null);

    await s.consistency();

    const delete_section = await deleteSection(section_addr.Ok)(alice)
    console.log(delete_section);
    t.ok(delete_section.Ok);
    await s.consistency();
  }
);

/********** ENROL_IN_COURSE & GET_ALL_STUDENTS & GET_MY_ENROLLED_COURSES **********/
orchestrator.registerScenario("Scenario10: Create new course and get latest", async (s, t) => {
  const { alice, bob } = await s.players(
    { alice: conductorConfig, bob: conductorConfig },
    true
  );
  const course_addr = await createCourse("course test 1", 123)(alice);
  console.log(course_addr);
  t.ok(course_addr.Ok);

  await s.consistency();

  const enrolled_addr = await enrolInCourse(course_addr.Ok)(bob);
  console.log("enrolled");
  t.ok(enrolled_addr.Ok);

  await s.consistency();

  const all_enrolled_courses = await getMyEnrolledCourse()(bob);
  console.log("my_enrolled_courses");
  t.true(all_enrolled_courses.Ok[0] != null);

  const all_students = await getAllStudents(course_addr.Ok)(alice);
  console.log("all_students");
  t.true(all_students.Ok[0] != null);


  // Wait for all network activity to settle
  await s.consistency();
});

/********** UPDATE_SECTION & UPDATE_CONTENT ********/
orchestrator.registerScenario("Scenario11: update section and content", async (s, t) => {
  const { alice, bob } = await s.players(
    { alice: conductorConfig, bob: conductorConfig },
    true
  );
  const course_addr = await createCourse("course test 1", 123)(alice);
  console.log(course_addr);
  t.ok(course_addr.Ok);

  await s.consistency();
  
  const section_addr = await createSection("section 1 for course 1", course_addr.Ok, 234)(alice);
  t.ok(section_addr.Ok);
  
  await s.consistency();

  const content_addr = await createContent(
    "content 1 for section 1",
    section_addr.Ok,
    "https://youtube.com",
    7891,
    "Holochain Intro-Video"
    )(alice);
  console.log(content_addr);
  t.ok(content_addr.Ok);

  await s.consistency();
  
  const updated_section_addr = await updateSection("updated section title", section_addr.Ok)(alice);
  console.log("update_section")
  console.log(updated_section_addr.Ok)
  t.ok(updated_section_addr.Ok);
  
  await s.consistency();
  
  // this will fail since bob is not the teacher
  const updated_section_addr_fail = await updateSection("updated section title", section_addr.Ok)(bob);
  console.log("update_section failed");
  console.log(updated_section_addr_fail);
  t.error(updated_section_addr_fail.Ok);
  
  await s.consistency();
  
  const update_content_addr = await updateContent(
    content_addr.Ok,
    "updated content for section 1",
    "https://youtube.com",
    "Holochain Intro-Video"
    )(alice);
    console.log("updated_content");
    console.log(update_content_addr.Ok);
    t.ok(update_content_addr.Ok)
    
  await s.consistency();

  // this will also fail since bob is not the teacher of this course
  const update_content_addr_fail = await updateContent(
    update_content_addr.Ok,
    "updated content for section 1",
    "https://youtube.com",
    "Holochain Intro-Video"
  )(bob);
  console.log("update_content failed");
  console.log(update_content_addr_fail);
  t.error(update_content_addr_fail.Ok);

  // Wait for all network activity to settle
  await s.consistency();
});

orchestrator.run();