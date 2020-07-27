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


// orchestrator.registerScenario("Write you scenario here", async (s, t) => {
//   const { alice, bob } = await s.players(
//     { alice: conductorConfig, bob: conductorConfig },
//     true
//   );

//   const course_addr_1 = await alice.call(
//     "course_dna",
//     "courses",
//     "create_course",
//     {
//       title: "course for scenario 5-1",
//       timestamp: 123
//     }
//   );

//   console.log(course_addr_1);
//   t.ok(course_addr_1.Ok);
//   await s.consistency();

//   const course_addr_2 = await alice.call(
//     "course_dna",
//     "courses",
//     "create_course",
//     {
//       title: "course for scenario 5-2",
//       timestamp: 1234
//     }
//   );
//   console.log(course_addr_2);
//   t.ok(course_addr_2.Ok);
//   await s.consistency();

//   const all_courses_alice = await alice.call("course_dna", "courses", "get_my_courses", {
//   });

//   t.true(all_courses_alice.Ok[0] != null);
//   t.true(all_courses_alice.Ok[1] != null);

//   const all_courses_bob = await bob.call("course_dna", "courses", "get_all_courses", {
//   });
//   t.true(all_courses_alice.Ok[0] != null);
//   t.true(all_courses_alice.Ok[1] != null);

//   await s.consistency();

// });


function createCourse(title, timestamp) {
  return (caller) => 
    caller.call("course_dna", "courses", "create_course", {
      title,
      timestamp,
    })
};

function getLatestCouseEntry(courseAnchorAddress) {
  return (caller) =>
    caller.call("course_dna", "courses", "get_latest_course_entry", {
      course_anchor_address: courseAnchorAddress,
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

function createSection(title, courseAnchorAddress, timestamp) {
  return (caller) =>
  caller.call("course_dna", "courses", "create_section", {
    title,
    course_anchor_address: courseAnchorAddress,
    timestamp,
  })
};

function getLatestSectionEntry(sectionAnchorAddress) {
  return (caller) =>
    caller.call("course_dna", "courses", "get_latest_section_entry", {
      section_anchor_address: sectionAnchorAddress,
    })
};



/*******  CREATE_COURSE & GET_LATEST_COURSE_ENTRYs *********/
// orchestrator.registerScenario("Scenario1: Create new course and get latest", async (s, t) => {
//   const { alice, bob } = await s.players(
//     { alice: conductorConfig, bob: conductorConfig },
//     true
//   );
//   const course_addr = await createCourse("course test 1", 123)(alice);
//   console.log(course_addr);
//   t.ok(course_addr.Ok);

//   await s.consistency();

//   const course = await getLatestCouseEntry(course_addr.Ok)(bob);
//   console.log("course");
//   console.log(course);
//   t.deepEqual(course.Ok, {
//     title: "course test 1",
//     timestamp: 123,
//     teacher_address: alice.instance("course_dna").agentAddress,
//     sections: [],
//     anchor_address: course_addr.Ok,
//   });
//   // Wait for all network activity to settle
//   await s.consistency();
// });

/*********** UPDATE_COURSE ********/
// orchestrator.registerScenario("Scenario2: Update course title", async (s, t) => {
//   const { alice, bob } = await s.players(
//     { alice: conductorConfig, bob: conductorConfig },
//     true
//   );
//   const course_addr = await createCourse("new course test for update test", 123)(alice);
//   const course_update_addrss = await updateCourse("course title updated", [], course_addr.Ok)(alice);
//   await s.consistency();
//   const course = await getLatestCouseEntry(course_addr.Ok)(bob);
//   t.deepEqual(course.Ok, {
//     title: "course title updated",
//     timestamp: 123,
//     teacher_address: alice.instance("course_dna").agentAddress,
//     sections: [],
//     anchor_address: course_update_addrss.Ok
//   });
// });

/*********** DELETE_COURSE ********/
// orchestrator.registerScenario("Scenario3: Delete course", async (s, t) => {
//   const { alice, bob } = await s.players(
//     { alice: conductorConfig, bob: conductorConfig },
//     true
//   );
//   const course_addr = await createCourse("new course test for delete scenario", 123)(alice);
//   await s.consistency();

//   const delete_result = await deleteCourse(course_addr.Ok)(alice);
//   await s.consistency();
  
//   console.log("deleted");
//   console.log(delete_result);
//   t.ok(delete_result.Ok);

//   const course = await getLatestCouseEntry(course_addr.Ok)(bob);
//   console.log("course");
//   console.log(course);
//   t.deepEqual(course.Ok, null);
//   await s.consistency();

// });

/** CREATE_SECTION & GET_LATEST_SECTION_ENTRY*/
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


// orchestrator.registerScenario("Scenario5: Get All My Courses", async (s, t) => {
//   const { alice, bob } = await s.players(
//     { alice: conductorConfig, bob: conductorConfig },
//     true
//   );
//   const course_addr_1 = await alice.call(
//     "course_dna",
//     "courses",
//     "create_course",
//     {
//       title: "course for scenario 5-1",
//       timestamp: 123
//     }
//   );
//   console.log(course_addr_1);
//   t.ok(course_addr_1.Ok);

//   await s.consistency();

//   const course_addr_2 = await alice.call(
//     "course_dna",
//     "courses",
//     "create_course",
//     {
//       title: "course for scenario 5-2",
//       timestamp: 1234
//     }
//   );
//   console.log(course_addr_2);
//   t.ok(course_addr_2.Ok);

//   await s.consistency();


//   const all_courses_alice = await alice.call("course_dna", "courses", "get_my_courses", {
//   });
//   t.true(all_courses_alice.Ok[0] != null);
//   t.true(all_courses_alice.Ok[1] != null);

//   const all_courses_bob = await bob.call("course_dna", "courses", "get_my_courses", {
//   });
//   t.true(all_courses_bob.Ok[0] == null);

//   await s.consistency();

// });



// orchestrator.registerScenario("Scenario6: Create new Content for a Module", async (s, t) => {
//   const { alice, bob } = await s.players(
//     { alice: conductorConfig, bob: conductorConfig },
//     true
//   );
//   const course_addr = await alice.call(
//     "course_dna",
//     "courses",
//     "create_course",
//     {
//       title: "course for scenario 5"
//       , timestamp: 123
//     }
//   );
//   console.log(course_addr);
//   t.ok(course_addr.Ok);

//   await s.consistency();
//   const module_addr = await alice.call("course_dna", "courses", "create_module", {
//     title: "module 1 for course 1",
//     course_address: course_addr.Ok,
//     timestamp: 456
//   });

//   console.log(module_addr);
//   t.ok(module_addr.Ok);
//   await s.consistency();

//   const content_addr = await alice.call("course_dna", "courses", "create_content", {
//     name: "content 1 for module 1",
//     url: "https://youtube.com",
//     descritpion: "Holochain Intro",
//     module_address: module_addr.Ok,
//     timestamp: 789
//   });

//   console.log(content_addr);
//   t.ok(content_addr.Ok);
//   await s.consistency();
// });



// orchestrator.registerScenario("Scenario7: Get all contents of a module", async (s, t) => {
//   const { alice, bob } = await s.players(
//     { alice: conductorConfig, bob: conductorConfig },
//     true
//   );
//   const course_addr = await alice.call(
//     "course_dna",
//     "courses",
//     "create_course",
//     {
//       title: "course for scenario 5"
//       , timestamp: 123
//     }
//   );
//   console.log(course_addr);
//   t.ok(course_addr.Ok);

//   await s.consistency();
//   // Alice can create a module for course because she is the owner
//   const module_addr = await alice.call("course_dna", "courses", "create_module", {
//     title: "module 1 for course 1",
//     course_address: course_addr.Ok,
//     timestamp: 456
//   });

//   console.log(module_addr);
//   t.ok(module_addr.Ok);
//   await s.consistency();

//   const content_addr_1 = await alice.call("course_dna", "courses", "create_content", {
//     name: "content 1 for module 1",
//     url: "https://youtube.com",
//     descritpion: "Holochain Intro-Video",
//     module_address: module_addr.Ok,
//     timestamp: 7891
//   });

//   console.log(content_addr_1);
//   t.ok(content_addr_1.Ok);
//   await s.consistency();


//   const content_addr_2 = await alice.call("course_dna", "courses", "create_content", {
//     name: "content 2 for module 1",
//     url: "https://soundclould.com",
//     descritpion: "Holochain Intro-Sound",
//     module_address: module_addr.Ok,
//     timestamp: 7892
//   });

//   console.log(content_addr_2);
//   t.ok(content_addr_2.Ok);
//   await s.consistency();


//   const all_contents_of_module_1 = await alice.call("course_dna", "courses", "get_contents", {
//     module_address: module_addr.Ok
//   });

//   t.true(all_contents_of_module_1.Ok[0] != null);
//   t.true(all_contents_of_module_1.Ok[1] != null);

//   await s.consistency();
// });



// orchestrator.registerScenario("Scenario8: delete content from module", async (s, t) => {
//   const { alice, bob } = await s.players(
//     { alice: conductorConfig, bob: conductorConfig },
//     true
//   );
//   const course_addr = await alice.call(
//     "course_dna",
//     "courses",
//     "create_course",
//     {
//       title: "course for scenario 5"
//       , timestamp: 123
//     }
//   );
//   console.log(course_addr);
//   t.ok(course_addr.Ok);

//   await s.consistency();
//   // Alice can create a module for course because she is the owner
//   const module_addr = await alice.call("course_dna", "courses", "create_module", {
//     title: "module 1 for course 1",
//     course_address: course_addr.Ok,
//     timestamp: 456
//   });

//   console.log(module_addr);
//   t.ok(module_addr.Ok);
//   await s.consistency();

//   const content_addr_1 = await alice.call("course_dna", "courses", "create_content", {
//     name: "content 1 for module 1",
//     url: "https://youtube.com",
//     descritpion: "Holochain Intro-Video",
//     module_address: module_addr.Ok,
//     timestamp: 7891
//   });

//   console.log(content_addr_1);
//   t.ok(content_addr_1.Ok);
//   await s.consistency();


//   const content_addr_2 = await alice.call("course_dna", "courses", "create_content", {
//     name: "content 2 for module 1",
//     url: "https://soundclould.com",
//     descritpion: "Holochain Intro-Sound",
//     module_address: module_addr.Ok,
//     timestamp: 7892
//   });

//   console.log(content_addr_2);
//   t.ok(content_addr_2.Ok);
//   await s.consistency();


//   const all_contents_of_module_1 = await alice.call("course_dna", "courses", "get_contents", {
//     module_address: module_addr.Ok
//   });

//   t.true(all_contents_of_module_1.Ok[0] != null);
//   t.true(all_contents_of_module_1.Ok[1] != null);
//   await s.consistency();

//   const delete_content = await alice.call("course_dna", "courses", "delete_content", {
//     content_address: content_addr_1.Ok
//   });
//   console.log("Hedayat_abedijoo_");
//   console.log(delete_content);
//   t.ok(delete_content.Ok);

//   await s.consistency();

//   // const all_contents_of_module_1_again = await alice.call("course_dna", "courses", "get_contents", {
//   //   module_address: module_addr.Ok
//   // });

//   // t.true(all_contents_of_module_1.Ok[0] != null);
//   // t.true(all_contents_of_module_1.Ok[1] == null);

//   await s.consistency();
// });


// orchestrator.registerScenario(
//   "Scenario9: delete module from course, Testing bug scenario",
//   async (s, t) => {
//     const { alice, bob } = await s.players(
//       { alice: conductorConfig, bob: conductorConfig },
//       true
//     );
//     const course_addr = await alice.call(
//       "course_dna",
//       "courses",
//       "create_course",
//       {
//         title: "course for scenario 9: debugging purpose",
//         timestamp: 123
//       }
//     );
//     console.log("Hedayat_abedijoo_course_addr");
//     console.log(course_addr);
//     t.ok(course_addr.Ok);

//     await s.consistency();
//     // Alice can create a module for course because she is the owner
//     const module_addr = await alice.call(
//       "course_dna",
//       "courses",
//       "create_module",
//       {
//         title: "module 1 for course 1",
//         course_address: course_addr.Ok,
//         timestamp: 456
//       }
//     );

//     console.log(module_addr);
//     t.ok(module_addr.Ok);
//     await s.consistency();

//     const delete_moduel = await alice.call(
//       "course_dna",
//       "courses",
//       "delete_module",
//       {
//         module_address: module_addr.Ok
//       }
//     );
//     console.log(delete_moduel);
//     t.ok(delete_moduel.Ok);
//     await s.consistency();

//     const courseResult = await alice.call(
//       "course_dna",
//       "courses",
//       "get_my_courses",
//       {
//         // address: course_addr.Ok
//       }
//     );
//     console.log("Hedayat_abedijoo_getmycourse");
//     console.log(courseResult.Ok);
//     //t.deepEqual(course_addr.Ok, courseResult.Ok[0]);
//     await s.consistency();

//     console.log("Hedayat_abedijoo_getentry");
//     const course_again = await alice.call(
//       "course_dna",
//       "courses",
//       "get_entry",
//       {
//         address: course_addr.Ok
//       }
//     );
//     console.log(course_again.Ok);
//     await s.consistency();

//     const content_addr_1 = await alice.call("course_dna", "courses", "create_content", {
//       name: "content 1 for module 1",
//       url: "https://youtube.com",
//       descritpion: "Holochain Intro-Video",
//       module_address: module_addr.Ok,
//       timestamp: 7891
//     });

//     console.log(content_addr_1);
//     t.ok(content_addr_1.Ok);
//     await s.consistency();

//     const content_addr_2 = await alice.call("course_dna", "courses", "create_content", {
//       name: "content 2 for module 1",
//       url: "https://soundclould.com",
//       descritpion: "Holochain Intro-Sound",
//       module_address: module_addr.Ok,
//       timestamp: 7892
//     });

//     console.log(content_addr_2);
//     t.ok(content_addr_2.Ok);
//     await s.consistency();

//     const all_contents_of_module_1 = await alice.call("course_dna", "courses", "get_contents", {
//       module_address: module_addr.Ok
//     });

//     t.true(all_contents_of_module_1.Ok[0] != null);
//     t.true(all_contents_of_module_1.Ok[1] != null);
//     await s.consistency();

//     const delete_content = await alice.call("course_dna", "courses", "delete_content", {
//       content_address: content_addr_1.Ok
//     });
//     console.log("Hedayat_abedijoo_");
//     console.log(delete_content);
//     t.ok(delete_content.Ok);

//     await s.consistency();

//     const all_contents_of_module_1_again = await alice.call("course_dna", "courses", "get_contents", {
//       module_address: module_addr.Ok
//     });

//     t.true(all_contents_of_module_1.Ok[0] != null);
//     t.true(all_contents_of_module_1.Ok[1] == null);

//     await s.consistency();
//   }
// );

orchestrator.run();