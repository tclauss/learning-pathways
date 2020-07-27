use hdk::{
    entry_definition::ValidatingEntryType,
    holochain_core_types::{dna::entry_types::Sharing, validation::EntryValidationData},
    holochain_json_api::{error::JsonError, json::JsonString},
    holochain_persistence_api::cas::content::Address,
};
use holochain_entry_utils::HolochainEntry;

use super::validation::{validate_author, validate_section_title};
#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Section {
    pub title: String,
    pub course_address: Address,
    pub timestamp: u64,
    pub anchor_address: Address,
}

impl Section {
    pub fn new(
        title: String,
        course_address: Address,
        timestamp: u64,
        anchor_address: Address,
    ) -> Self {
        Section {
            title: title,
            course_address: course_address,
            timestamp: timestamp,
            anchor_address: anchor_address,
        }
    }
}

impl HolochainEntry for Section {
    fn entry_type() -> String {
        String::from("section")
    }
}

pub fn entry_def() -> ValidatingEntryType {
    entry!(
        name: Section::entry_type(),
        description: "this is the definition of section",
        sharing: Sharing::Public,
        validation_package: || {
            hdk::ValidationPackageDefinition::Entry
        },
        validation: | validation_data: hdk::EntryValidationData<Section>| {
            match  validation_data {
                EntryValidationData::Create { entry, validation_data } => {
                    validate_section_title(&entry.title)?;

                    validate_author(validation_data, &entry)?;

                    Ok(())
                },
                EntryValidationData::Modify { new_entry, old_entry, validation_data, .. } => {
                    validate_section_title(&new_entry.title)?;

                    if new_entry.course_address != old_entry.course_address {
                        return Err(String::from("Cannot change course to which the section belongs"));
                    }
                    validate_author(validation_data, &new_entry)?;
                    Ok(())
                },
                EntryValidationData::Delete { old_entry, validation_data, .. } => {
                    validate_author(validation_data, &old_entry)?;

                    Ok(())
                }
            }
        },
        // Since now Section entry is a data entry that is hidden behind the SectionAnchor,
        // there won't be any links that it has.
        links:[]
    )
}
